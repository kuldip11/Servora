import type { WaiterMenuCategory } from "@/features/menu/api/menu";
import { FOOD_TYPE_FILTERS } from "@/features/menu/constants";

interface Props {
  foodTypeFilter: "ALL" | "VEG" | "NON_VEG" | "EGG";
  onFoodTypeChange: (value: "ALL" | "VEG" | "NON_VEG" | "EGG") => void;
  categories: WaiterMenuCategory[] | undefined;
  activeCategory: string | null;
  onCategoryChange: (id: string) => void;
  menuSearch: string;
}

export const CategoryTabs = ({
  foodTypeFilter,
  onFoodTypeChange,
  categories,
  activeCategory,
  onCategoryChange,
  menuSearch,
}: Props) => {
  return (
    <>
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {FOOD_TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFoodTypeChange(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
              foodTypeFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!menuSearch && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
