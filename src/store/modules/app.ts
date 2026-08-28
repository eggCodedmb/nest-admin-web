import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebar: {
      opened: localStorage.getItem('sidebarStatus') ? !!+localStorage.getItem('sidebarStatus')! : true,
      withoutAnimation: false,
    },
    device: 'desktop',
    size: localStorage.getItem('size') || 'default',
  }),
  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened;
      this.sidebar.withoutAnimation = false;
      if (this.sidebar.opened) {
        localStorage.setItem('sidebarStatus', '1');
      } else {
        localStorage.setItem('sidebarStatus', '0');
      }
    },
    closeSideBar({ withoutAnimation }: { withoutAnimation: boolean }) {
      localStorage.setItem('sidebarStatus', '0');
      this.sidebar.opened = false;
      this.sidebar.withoutAnimation = withoutAnimation;
    },
    toggleDevice(device: string) {
      this.device = device;
    },
    setSize(size: string) {
      this.size = size;
      localStorage.setItem('size', size);
    },
  },
});
