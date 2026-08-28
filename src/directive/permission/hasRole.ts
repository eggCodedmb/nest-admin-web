import type { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store/modules/user';

export const hasRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    const { value } = binding;
    const superAdmin = 'admin';
    const roles = useUserStore().roles;

    if (value && Array.isArray(value) && value.length > 0) {
      const hasRoleFlag = roles.some((role) => {
        return superAdmin === role || value.includes(role);
      });

      if (!hasRoleFlag) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error("请设置角色权限标签值，例如 v-hasRole=\"['admin']\"");
    }
  },
};
