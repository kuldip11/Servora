import { useQuery } from '@tanstack/react-query';
import { menuHolidaysQuery } from '../query-options';

export function useMenuHolidays() {
  return useQuery(menuHolidaysQuery());
}
