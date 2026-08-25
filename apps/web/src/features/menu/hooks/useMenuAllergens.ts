import { useQuery } from '@tanstack/react-query';
import { menuAllergensQuery } from '../query-options';

export function useMenuAllergens() {
  return useQuery(menuAllergensQuery());
}
