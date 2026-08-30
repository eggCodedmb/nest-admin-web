/**
 * 部门实体
 */
export interface DeptEntity {
  id: number;
  parentId: number;
  mpath: string;
  deptName: string;
  orderNum: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number; // 0停用 1正常
  createdAt: string;
  updatedAt: string;
  children?: DeptEntity[];
}

/**
 * 角色实体
 */
export interface RoleEntity {
  id: number;
  roleName: string;
  roleKey: string;
  orderNum: number;
  dataScope: number; // 1全部 2本部门及以下 3本部门 4仅本人 5自定义
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  menus?: MenuEntity[];
  depts?: DeptEntity[];
}

/**
 * 菜单实体
 */
export interface MenuEntity {
  id: number;
  parentId: number;
  mpath: string;
  menuName: string;
  orderNum: number;
  path: string;
  component: string;
  isFrame: number; // 0否 1是
  isCache: number; // 0不缓存 1缓存
  menuType: 'M' | 'C' | 'F'; // M目录 C菜单 F按钮
  visible: number; // 0隐藏 1显示
  status: number; // 0停用 1正常
  perms?: string;
  icon?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  children?: MenuEntity[];
}

/**
 * 用户实体
 */
export interface UserEntity {
  id: number;
  deptId?: number;
  username: string;
  nickname: string;
  password?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  sex: number; // 0未知 1男 2女
  status: number; // 0停用 1正常
  loginIp?: string;
  loginDate?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  dept?: DeptEntity;
  roles?: RoleEntity[];
  roleIds?: number[];
}

/**
 * 字典类型实体
 */
export interface DictTypeEntity {
  id: number;
  dictName: string;
  dictType: string;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 字典数据实体
 */
export interface DictDataEntity {
  id: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  cssClass?: string;
  listClass?: string; // default / primary / success / warning / danger
  isDefault: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 参数配置实体
 */
export interface ConfigEntity {
  id: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: number; // 0否 1是
  status: number; // 0停用 1启用
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 操作日志实体
 */
export interface OperLogEntity {
  id: number;
  title: string;
  businessType: number; // 1新增 2修改 3删除 4导出 5导入 0其他
  method: string;
  requestMethod: string;
  operUserId?: number;
  operName: string;
  deptName?: string;
  operUrl: string;
  operIp: string;
  operLocation?: string;
  operParam?: any;
  jsonResult?: any;
  status: number; // 1正常 0异常
  errorMsg?: string;
  costTime: number;
  operTime: string;
}
