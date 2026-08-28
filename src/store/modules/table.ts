import { defineStore } from 'pinia';

export interface TableState {
  columnsMap: Record<string, Record<string, boolean>>;
}

export const useTableStore = defineStore('table', {
  state: (): TableState => ({
    columnsMap: {},
  }),
  getters: {
    getTableColumns: (state) => {
      return (tableKey: string): Record<string, boolean> | undefined => {
        return state.columnsMap[tableKey];
      };
    },
  },
  actions: {
    setTableColumns(tableKey: string, columns: Record<string, boolean>) {
      this.columnsMap[tableKey] = { ...columns };
    },
    setColumnVisibility(tableKey: string, colKey: string, isShow: boolean) {
      if (!this.columnsMap[tableKey]) {
        this.columnsMap[tableKey] = {};
      }
      this.columnsMap[tableKey][colKey] = isShow;
    },
    resetTableColumns(tableKey: string) {
      delete this.columnsMap[tableKey];
    },
  },
  persist: true,
});
