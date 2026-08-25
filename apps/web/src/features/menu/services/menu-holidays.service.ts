import { apiClient } from '../../../shared/lib/api-client';
import type { Holiday } from '@pos/types';

export interface HolidayFormInput {
  name: string;
  holidayDate: string;
  region?: string | undefined;
}

export const menuHolidaysService = {
  async list(): Promise<Holiday[]> {
    const res = await apiClient.get('/menu/holidays');
    return res.data.data;
  },

  async add(input: HolidayFormInput): Promise<Holiday> {
    const res = await apiClient.post('/menu/holidays', input);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/holidays/${id}`);
  },
};
