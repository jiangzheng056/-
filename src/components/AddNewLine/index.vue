<template>
    <el-dialog v-model="dialogVisible" title="新增行" width="500px" @close="handleClose" destroy-on-close>
        <el-form :rules="formRules" ref="formRef" label-position="top" :model="formData" label-width="auto"
            style="max-width: 600px">
            <el-form-item v-for="(item, index) in listData" :key="index" :label="item.name"
                :prop="`termInfo.${item.code}`">
                <el-input v-model="formData.termInfo[item.code]" :placeholder="`请输入${item.name}`" />
            </el-form-item>
            <el-form-item label="术语解释" prop="termProfile">
                <el-input v-model="formData.termProfile" placeholder="请输入术语解释" />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="handleSubmit()" :loading="submitLoading">确认</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { saveEntry } from '@/api/noun';

const props = defineProps({
    id: {
        type: [Number, String],
        default: ''
    },
    listData: {
        type: Array,
        default: () => []
    },
    visible: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: () => ({})
    },
});

const emit = defineEmits(['update:visible', 'submit', 'closeAddNewLine']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const formData = reactive({
    termInfo: {},
    termProfile: ''
});

const projectId = ref(props.id || '');

const formRules = computed(() => {
    const rules = {};
    if (props.listData.length > 0) {
        props.listData.forEach(item => {
            rules[`termInfo.${item.code}`] = [
                { required: true, message: `请输入${item.name}！`, trigger: 'blur' },
                { min: 1, max: 200, message: `${item.name}长度 1-200 字符`, trigger: 'blur' }
            ];
        });
    }
    rules.termProfile = [
        { max: 500, message: '术语解释最长 500 字符', trigger: 'blur' }
    ];
    return rules;
});

const formRef = ref(null);
const submitLoading = ref(false);

watch(() => props.id, (newId) => {
    projectId.value = newId || '';
}, { immediate: true, deep: true });

watch(() => props.visible, async (visible) => {
    if (visible) {
        await nextTick();
        resetForm();
    } else {
        submitLoading.value = false;
    }
}, { immediate: false });

const resetForm = () => {
    if (props.listData.length === 0) return;
    props.listData.forEach(item => {
        formData.termInfo[item.code] = '';
    });
    formData.termProfile = '';
    if (formRef.value) {
        formRef.value?.clearValidate();
        formRef.value?.resetFields();
    }
};

const handleClose = () => {
    resetForm();
    emit('closeAddNewLine');
    emit('update:visible', false);
};

const handleSubmit = () => {
    if (submitLoading.value || !formRef.value) return;

    formRef.value.validate((valid) => {
        if (!valid) return;

        if (!projectId.value) {
            ElMessage.warning('项目 ID 为空，请选择项目后再操作！');
            return;
        }

        submitLoading.value = true;

        const submitData = JSON.parse(JSON.stringify(formData));
        submitData.projectId = projectId.value;

        saveEntry(submitData).then(res => {
            if (res.code === 200) {
                ElMessage.success('新增词条成功！');
                emit('submit');
                handleClose();
            } else {
                ElMessage.error(res.msg || res.message || '新增词条失败，请重试');
            }
        }).catch(error => {
            console.error('提交接口异常：', error);
            ElMessage.error(error.msg || error.message || '提交失败，网络异常或服务器错误');
        }).finally(() => {
            submitLoading.value = false;
        });
    });
};

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

:deep(.el-input__wrapper) {
    border-radius: 6px;
}

:deep(.el-textarea__wrapper) {
    border-radius: 6px;
}

@media (max-width: 768px) {
    :deep(.el-dialog) {
        width: 90% !important;
        margin: 20px auto;
    }
}
</style>
