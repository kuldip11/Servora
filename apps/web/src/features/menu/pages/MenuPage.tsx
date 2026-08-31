import { useState } from "react";
import { ListChecks, Upload } from "lucide-react";
import { Button, Page, PageHeader, Tabs, type TabItem } from "@pos/ui";
import { ItemFormModal } from "../components/ItemFormModal";
import { MenuItemsContent } from "../components/MenuItemsContent";
import { MenuCategoriesSection } from "../components/MenuCategoriesSection";
import { MenuSpecializedSection } from "../components/MenuSpecializedSection";
import { ModifierGroupsSection } from "../components/ModifierGroupsSection";
import { TagsSection } from "../components/TagsSection";
import { HolidaysSection } from "../components/HolidaysSection";
import {
  TemplatesSection,
  SaveTemplateModal,
} from "../components/TemplatesSection";
import { ExportMenu } from "../components/ExportMenu";
import { ImportWizard } from "../components/ImportWizard";
import { useMenuCategories } from "../hooks/useMenuCategories";
import { useMenuTags } from "../hooks/useMenuTags";
import { useToggleItemAvailability } from "../hooks/useToggleItemAvailability";
import { useDeleteMenuItem } from "../hooks/useDeleteMenuItem";
import { useDuplicateMenuItem } from "../hooks/useDuplicateMenuItem";
import { useSetItemPublished } from "../hooks/useSetItemPublished";
import type { MenuItem, FoodType, MenuItemStatus } from "@pos/types";
import { MenusSection } from "../components/MenusSection";
import { KitchenStationsSection } from "../components/KitchenStationsSection";
import { CombosSection } from "../components/CombosSection";
import { PromotionsSection } from "../components/PromotionsSection";
import { LoyaltySection } from "../components/LoyaltySection";
import { HappyHourSection } from "../components/HappyHourSection";
import { CustomerGroupsSection } from "../components/CustomerGroupsSection";
import { BuffetPricingSection } from "../components/BuffetPricingSection";
import { OrganizationManagementSection } from "../components/OrganizationManagementSection";
import { GuidedComboPromotionBuilder } from "../components/GuidedComboPromotionBuilder";

const TABS = [
  { id: "items", label: "Items" },
  { id: "menus", label: "Menus" },
  { id: "combos", label: "Combos" },
  { id: "promotions", label: "Promotions" },
  { id: "loyalty", label: "Loyalty" },
  { id: "happy-hour", label: "Happy Hour" },
  { id: "advanced", label: "Advanced Models" },
  { id: "categories", label: "Categories" },
  { id: "modifiers", label: "Modifiers" },
  { id: "recipes", label: "Recipes" },
  { id: "availability", label: "Availability" },
  { id: "stations", label: "Stations" },
  { id: "tools", label: "Tools" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MenuPage() {
  const [tab, setTab] = useState<TabId>("items");
  const [showImport, setShowImport] = useState(false);
  const [savingTemplateFor, setSavingTemplateFor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemForm, setItemForm] = useState<{
    categoryId: string;
    item: MenuItem | null;
  } | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<MenuItemStatus | "ALL">(
    "ALL",
  );
  const [publishFilter, setPublishFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT"
  >("ALL");

  const { data: categories, isLoading } = useMenuCategories();
  const { data: tags } = useMenuTags();
  const toggleAvailMutation = useToggleItemAvailability();
  const deleteItemMutation = useDeleteMenuItem();
  const duplicateItemMutation = useDuplicateMenuItem();
  const publishMutation = useSetItemPublished();

  const itemsContent = (
    <MenuItemsContent
      itemSearch={itemSearch}
      setItemSearch={setItemSearch}
      selectMode={selectMode}
      selectedIds={selectedIds}
      categories={categories ?? []}
      tags={tags ?? []}
      isLoading={isLoading}
      foodTypeFilter={foodTypeFilter}
      statusFilter={statusFilter}
      publishFilter={publishFilter}
      setFoodTypeFilter={setFoodTypeFilter}
      setStatusFilter={setStatusFilter}
      setPublishFilter={setPublishFilter}
      setSelectedIds={setSelectedIds}
      setItemForm={setItemForm}
      toggleAvailMutation={toggleAvailMutation}
      deleteItemMutation={deleteItemMutation}
      duplicateItemMutation={duplicateItemMutation}
      publishMutation={publishMutation}
    />
  );

  const toolsContent = (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-text-primary">
          Import & Export
        </h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Move menu data in bulk without adding operational controls to the
          Items screen.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" /> Import Items
          </Button>
          <ExportMenu />
        </div>
      </section>
      <section>
        <TemplatesSection />
      </section>
      <section>
        <TagsSection />
      </section>
      <section>
        <HolidaysSection />
      </section>
    </div>
  );

  const tabItems: TabItem[] = [
    { value: "items", label: "Items", content: itemsContent },
    { value: "menus", label: "Menus", content: <MenusSection /> },
    { value: "guided-builder", label: "Guided Builder", content: <GuidedComboPromotionBuilder /> },
    { value: "combos", label: "Combos", content: <CombosSection /> },
    { value: "promotions", label: "Promotions", content: <PromotionsSection /> },
    { value: "loyalty", label: "Loyalty", content: <LoyaltySection /> },
    { value: "happy-hour", label: "Happy Hour", content: <HappyHourSection /> },
    { value: "advanced", label: "Advanced Models", content: <div className="space-y-10"><CustomerGroupsSection /><BuffetPricingSection /><OrganizationManagementSection /></div> },
    {
      value: "categories",
      label: "Categories",
      content: <MenuCategoriesSection onSaveTemplate={setSavingTemplateFor} />,
    },
    {
      value: "modifiers",
      label: "Modifiers",
      content: <ModifierGroupsSection />,
    },
    {
      value: "recipes",
      label: "Recipes",
      content: <MenuSpecializedSection mode="recipes" />,
    },
    {
      value: "availability",
      label: "Availability",
      content: <MenuSpecializedSection mode="availability" />,
    },
    { value: "stations", label: "Stations", content: <KitchenStationsSection /> },
    { value: "tools", label: "Tools", content: toolsContent },
  ];

  return (
    <Page>
      <PageHeader
        title="Menu"
        description={`${categories?.length ?? 0} categories`}
        actions={
          tab === "items" ? (
            <>
              <Button
                variant={selectMode ? "primary" : "secondary"}
                onClick={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds([]);
                }}
              >
                <ListChecks className="w-4 h-4" />{" "}
                {selectMode ? "Done selecting" : "Select items"}
              </Button>
            </>
          ) : undefined
        }
      />

      <Tabs
        items={tabItems}
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
      />

      {showImport && <ImportWizard onClose={() => setShowImport(false)} />}
      {savingTemplateFor && (
        <SaveTemplateModal
          category={savingTemplateFor}
          onClose={() => setSavingTemplateFor(null)}
        />
      )}
      {itemForm && (
        <ItemFormModal
          categoryId={itemForm.categoryId}
          item={itemForm.item}
          onClose={() => setItemForm(null)}
        />
      )}
    </Page>
  );
}
