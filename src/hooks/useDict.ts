import { toRefs, reactive } from 'vue';
import { getDictDataByType } from '@/api/system/dict';
import type { DictDataEntity } from '@/types/system';

const dictCache = new Map<string, DictDataEntity[]>();

export function useDict(...types: string[]) {
  const dictData = reactive<Record<string, DictDataEntity[]>>({});

  types.forEach((type) => {
    dictData[type] = [];
    if (dictCache.has(type)) {
      dictData[type] = dictCache.get(type)!;
    } else {
      getDictDataByType(type).then((res) => {
        dictData[type] = res;
        dictCache.set(type, res);
      });
    }
  });

  return toRefs(dictData);
}
