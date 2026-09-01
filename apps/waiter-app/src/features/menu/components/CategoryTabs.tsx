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
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {FOOD_TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFoodTypeChange(f.value)}
            className={`min-h-9 shrink-0 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition-colors ${
              foodTypeFilter === f.value
                ? "border-primary bg-primary-surface text-primary"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!menuSearch && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-4 text-xs font-semibold transition-colors ${
                activeCategory === cat.id
                  ? "border-primary bg-primary-surface text-primary"
                  : "border-border bg-surface text-text-secondary"
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
