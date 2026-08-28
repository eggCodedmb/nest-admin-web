import { reactive, toRefs, onMounted } from 'vue';

export interface TableState<T = any> {
  tableData: T[];
  loading: boolean;
  pageParam: {
    pageNum: number;
    pageSize: number;
    total: number;
  };
  searchParam: Record<string, any>;
  selectedList: T[];
}

export function useTable<T = any>(
  apiFn: (params: any) => Promise<{ rows: T[]; total: number } | any>,
  initParam: Record<string, any> = {},
  isAuto = true,
) {
  const state = reactive<TableState<T>>({
    tableData: [],
    loading: false,
    pageParam: {
      pageNum: 1,
      pageSize: 10,
      total: 0,
    },
    searchParam: { ...initParam },
    selectedList: [],
  });

  const getTableList = async () => {
    state.loading = true;
    try {
      const params = {
        pageNum: state.pageParam.pageNum,
        pageSize: state.pageParam.pageSize,
        ...state.searchParam,
      };
      const res = await apiFn(params);
      if (Array.isArray(res)) {
        state.tableData = res;
        state.pageParam.total = res.length;
      } else {
        state.tableData = res.rows || [];
        state.pageParam.total = res.total || 0;
      }
    } finally {
      state.loading = false;
    }
  };

  const search = () => {
    state.pageParam.pageNum = 1;
    getTableList();
  };

  const reset = (defaultParam: Record<string, any> = {}) => {
    state.pageParam.pageNum = 1;
    state.searchParam = { ...defaultParam };
    getTableList();
  };

  onMounted(() => {
    if (isAuto) getTableList();
  });

  return {
    ...toRefs(state),
    getTableList,
    search,
    reset,
  };
}
