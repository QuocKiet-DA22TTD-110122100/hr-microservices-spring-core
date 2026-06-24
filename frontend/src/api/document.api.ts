import apiClient from '@/utils/axios';
import { ApiResponse } from '@/types/common';

export interface DocumentMeta {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  departmentId: number;
  uploadedBy: string;
  createdAt: string;
}

export const documentApi = {
  list: async (): Promise<ApiResponse<DocumentMeta[]>> => {
    const res = await apiClient.get('/hr/documents');
    const data: DocumentMeta[] = Array.isArray(res.data) ? res.data : [];
    return { success: true, data, timestamp: new Date().toISOString() };
  },

  upload: async (file: File): Promise<ApiResponse<DocumentMeta>> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/hr/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, data: res.data, timestamp: new Date().toISOString() };
  },

  download: async (id: number, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/hr/documents/${id}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiClient.delete(`/hr/documents/${id}`);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  },
};
