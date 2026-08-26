import { FOOD_TYPE_FILTERS } from "../constants";

interface Props {
  foodTypeFilter: "ALL" | "VEG" | "NON_VEG" | "EGG";
  onFoodTypeChange: (value: "ALL" | "VEG" | "NON_VEG" | "EGG") => void;
  categories: any[] | undefined;
  activeCategory: string | null;
  onCategoryChange: (id: string) => void;
  menuSearch: string;
}

// Design-system Phase 11, Sprint WA-3 — retokenized only. **Not**
// migrated onto `Tabs` (Phase 6): both rows are horizontally-scrolling
// filter-chip strips (`overflow-x-auto no-scrollbar`), not `Tabs`'
// underline/segmented-bar shape, and both act as filters (food type,
// active category) rather than switching between separate content
// panels the way `Tabs` assumes — same "genuine shape difference, not
// a style preference" reasoning `MenuPage` (Admin, Sprint AD-9) used
// for its own filter-chip rows.
export function CategoryTabs({
  foodTypeFilter,
  onFoodTypeChange,
  categories,
  activeCategory,
  onCategoryChange,
  menuSearch,
}: Props) {
  return (
    <>
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
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
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {categories?.map((cat: any) => (
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
}
