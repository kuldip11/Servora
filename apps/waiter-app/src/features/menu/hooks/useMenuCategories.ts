import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../api/menu';

export function useMenuCategories() {
  return useQuery({
    queryKey: ['menu-categories'],
    queryFn: fetchCategories,
  });
}
