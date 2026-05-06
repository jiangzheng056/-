<template>
  <div>
    <!-- 用户权限对话框 -->
    <el-dialog v-model="dialogVisible" title="用户权限" width="600px" @close="handleClose">
      <el-form :model="userAuthForm" label-width="auto" style="max-width: 600px">
        <el-form-item label="用户/用户组选择">
          <el-select
            style="width: 100%;"
            clearable
            v-model="userCascaderSelect"
            value-key="id"
            @change="handleUserSelectChange"
            placeholder="请选择用户/用户组"
          >
            <el-option
              v-for="item in selectUserList"
              :key="item.id"
              :label="item.nodeName"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户已有权限">
          <el-select
            v-model="userAuthForm.roleAuths"
            clearable
            value-key="authCode"
            multiple
            placeholder="请选择权限"
            style="width: 100%"
          >
            <el-option
              v-for="item in customNounAuthList"
              :key="item.authCode"
              :label="item.authName"
              :value="item"
            />
            <el-option v-if="!customNounAuthList.length" label="暂无可用自定义权限" value="" disabled />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleClose">
            取消编辑
          </el-button>
          <el-button type="primary" @click="handleConfirmUserPermission">
            确认并应用
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getSingleNounAuth, getAllOrgNode, getNounGroupOrUserAuth, saveNounUserAuth } from '@/api/noun';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  nounId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['update:visible', 'permission-updated']);

const MSG = {
  NO_SELECT: '请选择用户/用户组',
  SUCCESS: '用户权限已应用',
  FAIL: '配置失败',
  ERROR: '权限配置异常，请重试',
  INCOMPLETE_DATA: '选中的用户/用户组信息不完整，无法获取权限数据',
  FETCH_AUTH_FAIL: '获取用户组/用户权限数据失败'
};

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const selectUserList = ref([]);
const userCascaderSelect = ref('');
const customNounAuthList = ref([]);
const userAuthForm = ref({
  id: '',
  authRole: [],
  node: [],
  roleAuths: []
});

const resetUserAuthRelateData = () => {
  userAuthForm.value.roleAuths = [];
  userAuthForm.value.authRole = [];
  userCascaderSelect.value = '';
  userAuthForm.value.node = [];
};

const unifyAuthCode = (val) => {
  return val == null ? '' : String(val);
};

const handleClose = () => {
  dialogVisible.value = false;
  resetUserAuthRelateData();
  userAuthForm.value = { id: '', authRole: [], node: [], roleAuths: [] };
};

const getSingleNounAuthList = async (nounId = props.nounId) => {
  try {
    const [authRes, orgRes] = await Promise.all([
      getSingleNounAuth({ nounId }),
      getAllOrgNode({ id: nounId })
    ]);
    selectUserList.value = orgRes.data || [];
    customNounAuthList.value = (authRes.data.customAuth || []).map(item => ({
      ...item,
      authCode: unifyAuthCode(item.authCode)
    }));
    resetUserAuthRelateData();
  } catch (error) {
    console.error('获取名词库权限列表失败:', error);
    customNounAuthList.value = [];
    selectUserList.value = [];
  }
};

const fetchUserAuthData = async (data) => {
  if (!data?.id || !data?.type) {
    ElMessage.warning(MSG.INCOMPLETE_DATA);
    resetUserAuthRelateData();
    return;
  }

  try {
    const res = await getNounGroupOrUserAuth({
      id: data.id,
      nodeType: data.type,
      nounId: props.nounId
    });

    const apiData = res.data || [];
    const firstItem = apiData[0] || {};
    let customAuth = firstItem.customAuth || [];

    customAuth = customAuth.map(item => ({
      ...item,
      authCode: unifyAuthCode(item.authCode)
    }));

    userAuthForm.value.roleAuths = [...customAuth];
    userAuthForm.value.authRole = [];
  } catch (error) {
    console.error('获取用户组/用户权限数据失败:', error);
    ElMessage.error(MSG.FETCH_AUTH_FAIL);
    resetUserAuthRelateData();
  }
};

const handleUserSelectChange = async (data) => {
  userAuthForm.value.node = [data];
  await fetchUserAuthData(data);
};

const handleConfirmUserPermission = async () => {
  try {
    if (!userAuthForm.value.node.length) {
      return ElMessage.warning(MSG.NO_SELECT);
    }
    const params = {
      id: props.nounId,
      node: userAuthForm.value.node,
      roleAuths: userAuthForm.value.roleAuths,
      authRole: null
    };
    const res = await saveNounUserAuth(params);
    if (res.code === 200) {
      ElMessage.success(MSG.SUCCESS);
      emit('permission-updated');
      handleClose();
    } else {
      ElMessage.error(res.message || MSG.FAIL);
    }
  } catch (error) {
    console.error('保存用户权限失败:', error);
    ElMessage.error(MSG.ERROR);
  }
};

getSingleNounAuthList();
</script>

<style scoped>
:deep(.el-select) {
  width: 100%;
}
:deep(.el-checkbox) {
  display: block;
  margin-bottom: 10px;
}
</style>
