import dayjs from 'dayjs';

/**
 * 常用日期时间格式常量
 */
export const DatePattern = {
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME_MINUTE: 'YYYY-MM-DD HH:mm',
  DATE_COMPACT: 'YYYYMMDD',
  DATETIME_COMPACT: 'YYYYMMDDHHmmss',
} as const;

/**
 * 统一通用日期时间格式化函数
 * 支持解析并转换：Date对象、时间戳(毫秒/秒)、ISO 8601字符串 (UTC时间)、dayjs实例等
 * 
 * @param time 待格式化的时间
 * @param format 格式化模式，默认 'YYYY-MM-DD HH:mm:ss'
 * @param placeholder 当时间为 null / undefined / 空字符串 / 非法时间 时的回退占位符，默认为 '--'
 * @returns 格式化后的字符串
 * 
 * @example
 * formatDate('2026-08-28T07:37:14.000Z') // '2026-08-28 15:37:14' (按本地时区解析)
 * formatDate(null) // '--'
 * formatDate(new Date(), 'YYYY-MM-DD') // '2026-08-28'
 */
export function formatDate(
  time: string | number | Date | dayjs.Dayjs | null | undefined,
  format: string = DatePattern.DATETIME,
  placeholder: string = '--',
): string {
  if (!time && time !== 0) {
    return placeholder;
  }

  // 兼容 10 位秒级 Unix 时间戳转换为 13 位毫秒级时间戳
  let parsedTime = time;
  if (typeof time === 'number' && time.toString().length === 10) {
    parsedTime = time * 1000;
  }

  const d = dayjs(parsedTime);
  if (!d.isValid()) {
    return placeholder;
  }

  return d.format(format);
}

/**
 * 兼容经典后台系统的 parseTime 别名函数
 */
export function parseTime(
  time: string | number | Date | null | undefined,
  pattern: string = DatePattern.DATETIME,
): string {
  return formatDate(time, pattern);
}

/**
 * Element Plus 表格专用的列格式化委托函数生成器 (el-table-column formatter)
 * 适用于直接传入 el-table-column 的 :formatter 或 ProTable 的 formatter 配置
 *
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @param placeholder 空值占位符，默认 '--'
 * @returns Element Plus 标准 formatter 委托回调函数
 * 
 * @example
 * // 1. 直接在模板中的 el-table-column 使用
 * <el-table-column prop="createdAt" label="创建时间" :formatter="dateFormatter()" />
 * 
 * // 2. 在 ProTable 列配置中使用
 * { prop: 'createdAt', label: '创建时间', formatter: dateFormatter('YYYY-MM-DD') }
 */
export function dateFormatter(format: string = DatePattern.DATETIME, placeholder: string = '--') {
  return (_row: any, _column?: any, cellValue?: any) => {
    return formatDate(cellValue, format, placeholder);
  };
}

/**
 * 格式化相对时间（例如：刚刚、5分钟前、3小时前、2天前）
 */
export function formatRelativeTime(
  time: string | number | Date | null | undefined,
  placeholder: string = '--',
): string {
  if (!time && time !== 0) return placeholder;
  const d = dayjs(time);
  if (!d.isValid()) return placeholder;

  const now = dayjs();
  const diffSec = now.diff(d, 'second');
  if (diffSec < 60) return '刚刚';
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = now.diff(d, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = now.diff(d, 'day');
  if (diffDay < 30) return `${diffDay}天前`;
  return d.format(DatePattern.DATE);
}
