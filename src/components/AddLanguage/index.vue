<template>
    <el-dialog v-model="dialogVisible" title="新增语言" width="500px">
        <el-form ref="ruleFormRef" :model="formData" :rules="rules" label-width="auto"
            style="max-width: 400px; margin: 0 auto">
            <el-form-item label="语言选择" prop="code">
                <el-select v-model="formData.code" placeholder="请选择新增语言" style="width: 240px">
                    <el-option v-for="item in options" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="submitForm(ruleFormRef)" :loading="submitLoading">
                    确认
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getLanguages, saveLanguage } from '@/api/noun'

const props = defineProps({
    id: {
        type: [Number, String],
        default: ''
    },
    visible: {
        type: Boolean,
        default: false
    },
})

const emit = defineEmits(['update:visible', 'closeDialog', 'refreshList'])

const formData = reactive({
    code: '',
})

const ruleFormRef = ref(null)
const options = ref([])
const submitLoading = ref(false)

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const rules = reactive({
    code: [
        { required: true, message: '请选择新增语言！', trigger: 'change' },
    ]
})

const getOptions = async () => {
    try {
        const res = await getLanguages()
        options.value = res.data || []
    } catch (error) {
        ElMessage.error('获取语言列表失败，请稍后重试！')
        console.error('获取语言列表报错：', error)
    }
}

getOptions()

const submitForm = async (formEl) => {
    if (!formEl) return
    formEl.validate(async (valid) => {
        if (valid) {
            try {
                submitLoading.value = true
                const res = await saveLanguage({ code: formData.code, id: props.id })
                if (res && (res.code === 200 || res.success)) {
                    ElMessage.success('新增语言成功！')
                    dialogVisible.value = false
                    emit('closeDialog')
                    emit('refreshList')
                    resetForm(formEl)
                } else {
                    ElMessage.error(res?.msg || '新增语言失败，请稍后重试！')
                }
            } catch (error) {
                ElMessage.error('新增语言请求失败，网络异常！')
                console.error('新增语言报错：', error)
            } finally {
                submitLoading.value = false
            }
        } else {
            ElMessage.warning('请完成表单必填项选择！')
        }
    })
}

const resetForm = (formEl) => {
    if (!formEl) return
    formEl.resetFields()
    formData.code = ''
}

const handleCancel = () => {
    resetForm(ruleFormRef.value)
    dialogVisible.value = false
    emit('closeDialog')
}
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
