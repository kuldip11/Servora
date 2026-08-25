import { useQuery } from '@tanstack/react-query';
import { menuItemRecipeQuery } from '../query-options';

export function useMenuItemRecipe(itemId: string) {
  return useQuery(menuItemRecipeQuery(itemId));
}
