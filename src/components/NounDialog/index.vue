<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close @close="handleClose">
        <el-form :rules="formRules" ref="formRef" label-position="top" :model="formData" label-width="auto"
            style="max-width: 600px">
            <!-- 头像上传区域 -->
            <el-form-item style="text-align: center; width: 100%;">
                <div class="avatar-uploader-box">
                    <el-upload :class="uploadFileList.length > 0 ? 'hideWindow' : ''"
                        :file-list="uploadFileList" :http-request="() => { }" :limit="1" :show-file-list="true"
                        :on-success="handleAvatarUploadSuccess" :before-upload="handleBeforeAvatarUpload"
                        :on-preview="handleAvatarPreview" list-type="picture-card" :on-remove="handleAvatarRemove">
                        <img v-if="formData.avatarUrl" style="width: 100%; height: 100%" :src="formData.avatarUrl"
                            class="avatar" />
                        <el-icon class="avatar-uploader-icon" v-else>
                            <Plus />
                        </el-icon>
                    </el-upload>
                    <el-dialog v-model="isAvatarPreviewDialogVisible">
                        <img width="100%" :src="previewImageUrl" alt="预览图片" />
                    </el-dialog>
                </div>
            </el-form-item>
            <!-- 词库名称 -->
            <el-form-item label="词库名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入词库名称" />
            </el-form-item>
            <!-- 词库描述 -->
            <el-form-item label="词库描述" prop="description">
                <el-input resize="none" :autosize="{ minRows: 4, maxRows: 4 }" v-model.trim="formData.description"
                    type="textarea" placeholder="请输入词库描述" />
            </el-form-item>
        </el-form>
        <!-- 底部按钮 -->
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消{{ isEditMode ? '编辑' : '创建' }}</el-button>
                <el-button type="primary" @click="handleSubmit">确认{{ isEditMode ? '编辑' : '创建' }}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue'
import { saveNounInfo, uploadFile } from '@/api/noun';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: () => ({})
    },
    isEdit: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['update:visible', 'close', 'submit']);

// 弹窗显隐双向绑定
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// 弹窗标题
const dialogTitle = computed(() => props.isEdit ? '编辑词库' : '新增词库');
const isEditMode = computed(() => props.isEdit);

// 预览图片地址
const previewImageUrl = computed(() => uploadFileList.value[0]?.url || '');

// 表单数据
const formData = reactive({
    id: '',
    avatarUrl: '',
    name: '',
    description: ''
});

// 表单验证规则
const formRules = reactive({
    name: [
        { required: true, message: '请输入词库名称', trigger: 'blur' },
        { max: 50, message: '词库名称长度不超过 50 个字符', trigger: 'blur' }
    ]
});

// 引用
const formRef = ref(null);
const uploadFileList = ref([]);
const isAvatarPreviewDialogVisible = ref(false);

// 监听父组件传递的编辑数据
watch(() => props.data, (newData) => {
    if (newData && Object.keys(newData).length > 0) {
        formData.id = newData.id || '';
        formData.avatarUrl = newData.avatarUrl || newData.icon || '';
        formData.name = newData.name || '';
        formData.description = newData.description || '';

        // 初始化上传文件列表
        if (formData.avatarUrl) {
            uploadFileList.value = [{ name: 'avatar.png', url: formData.avatarUrl, uid: Date.now() }];
        } else {
            uploadFileList.value = [];
        }
    }
}, { immediate: true, deep: true });

// 重置表单
const resetForm = () => {
    Object.assign(formData, {
        id: '',
        avatarUrl: '',
        name: '',
        description: ''
    });
    uploadFileList.value = [];

    nextTick(() => {
        if (formRef.value) {
            formRef.value.resetFields();
        }
    });
};

// 关闭对话框
const handleClose = () => {
    if (!props.isEdit) {
        resetForm();
    }
    emit('close');
};

// 头像上传前处理
const handleBeforeAvatarUpload = async (rawFile) => {
    try {
        const formData = new FormData();
        formData.append('file', rawFile);
        const res = await uploadFile(formData);
        if (res && (res.code === 200 || res.data)) {
            handleAvatarUploadSuccess(res.data, rawFile);
        } else {
            ElMessage.error('文件上传失败，接口返回异常');
        }
    } catch (error) {
        ElMessage.error(`文件上传失败：${error.message || '请重试'}`);
    }
    return false;
};

// 头像上传成功
const handleAvatarUploadSuccess = (response, rawFile) => {
    const realUrl = response.data?.data || response.data || response;
    if (!realUrl) {
        ElMessage.error("上传失败，未获取到图片链接");
        return;
    }

    uploadFileList.value = [{
        name: rawFile.name || 'avatar.png',
        url: realUrl,
        uid: rawFile.uid
    }];

    nextTick(() => {
        formData.avatarUrl = realUrl;
        ElMessage.success("头像上传成功");
    });
};

// 头像预览
const handleAvatarPreview = (file) => {
    isAvatarPreviewDialogVisible.value = true;
};

// 移除头像
const handleAvatarRemove = (_, fileList) => {
    formData.avatarUrl = '';
    uploadFileList.value = fileList;
};

// 提交表单
const handleSubmit = async () => {
    try {
        const valid = await formRef.value.validate();
        if (!valid) return;

        const params = {
            id: formData.id || undefined,
            avatarUrl: formData.avatarUrl,
            name: formData.name,
            description: formData.description
        };

        const res = await saveNounInfo(params);
        if (res.code === 200) {
            ElMessage.success(props.isEdit ? '编辑词库成功！' : '创建词库成功！');
            emit('submit');
            handleClose();
        } else {
            ElMessage.error(res?.message || '操作失败，请重试');
        }
    } catch (error) {
        ElMessage.error(`提交表单异常：${error.message || '请重试'}`);
    }
};

// 暴露方法给父组件
defineExpose({
    resetForm,
    validate: () => formRef.value?.validate()
});
</script>

<style scoped>
.dialog-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.avatar-uploader-box {
    margin-top: 20px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.el-icon.avatar-uploader-icon img {
    width: 100%;
    height: 100%;
}

:deep(.el-upload--picture-card) {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    width: 148px;
    height: 148px;
    transition: all 0.3s;
}

:deep(.el-upload--picture-card):hover {
    border-color: #409eff;
}

.hideWindow :deep(.el-upload--picture-card) {
    display: none !important;
}

.avatar {
    border-radius: 8px;
    object-fit: cover;
}

:deep(.el-upload-list__item) {
    width: 148px;
    height: 148px;
    margin: 0 auto;
}

:deep(.el-upload-list__item .el-upload-list__item-thumbnail) {
    width: 100%;
    height: 100%;
    border-radius: 8px;
}

:deep(.el-upload-list__item .el-upload-list__item-actions) {
    border-radius: 8px;
}

:deep(.el-input__wrapper) {
    border-radius: 6px;
}

:deep(.el-textarea__wrapper) {
    border-radius: 6px;
}

@media (max-width: 768px) {
    .el-dialog {
        width: 90% !important;
        margin: 20px auto;
    }

    .avatar-uploader-box {
        margin-top: 10px;
        margin-bottom: 15px;
    }

    .el-icon.avatar-uploader-icon {
        width: 120px;
        height: 120px;
    }

    :deep(.el-upload--picture-card) {
        width: 120px;
        height: 120px;
    }

    :deep(.el-upload-list__item) {
        width: 120px;
        height: 120px;
    }
}
</style>
