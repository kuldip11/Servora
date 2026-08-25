import { apiClient } from '../../../shared/lib/api-client';

export async function fetchTables(): Promise<any[]> {
  const res = await apiClient.get('/tables');
  return res.data.data;
}
