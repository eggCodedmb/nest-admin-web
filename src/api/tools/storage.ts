import request from '@/utils/request';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<any, UploadResult>({
    url: '/tools/storage/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
