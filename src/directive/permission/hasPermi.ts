import type { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store/modules/user';

export const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    const { value } = binding;
    const permissions = useUserStore().permissions;

    if (value && Array.isArray(value) && value.length > 0) {
      const hasPermission = permissions.some((perm) => {
        return perm === '*:*:*' || value.includes(perm);
      });

      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    } else {
      throw new Error("请设置操作权限标签值，例如 v-hasPermi=\"['sys:user:create']\"");
    }
  },
};
