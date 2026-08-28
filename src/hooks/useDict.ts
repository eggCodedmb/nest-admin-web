import { reactive, toRefs } from 'vue';
import { getDictDataByType } from '@/api/system/dict';
import type { DictDataEntity } from '@/types/system';

// 全局响应式字典缓存池
const dictCache = reactive<Record<string, DictDataEntity[]>>({});

/**
 * 获取指定字典数据
 * @param types 字典类型列表
 */
export function useDict(...types: string[]) {
  const dictData = reactive<Record<string, DictDataEntity[]>>({});

  types.forEach((type) => {
    dictData[type] = dictCache[type] || [];
    if (!dictCache[type] || dictCache[type].length === 0) {
      getDictDataByType(type).then((res) => {
        dictCache[type] = res || [];
        dictData[type] = dictCache[type];
      });
    }
  });

  return toRefs(dictData);
}

/**
 * 清除前端内存中的字典缓存
 * @param type 指定字典类型，不传则清空全部字典缓存
 */
export function cleanDictCache(type?: string) {
  if (type) {
    delete dictCache[type];
  } else {
    Object.keys(dictCache).forEach((key) => {
      delete dictCache[key];
    });
  }
}

/**
 * 重新拉取并刷新指定字典缓存
 * @param types 字典类型列表，不传则刷新所有已缓存的字典
 */
export async function refreshDictCache(...types: string[]) {
  const targetTypes = types.length > 0 ? types : Object.keys(dictCache);
  return Promise.all(
    targetTypes.map(async (type) => {
      try {
        const data = await getDictDataByType(type);
        dictCache[type] = data || [];
        return { type, data };
      } catch {
        return { type, data: [] };
      }
    }),
  );
}
