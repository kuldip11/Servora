import { useState } from "react";
import { Plus, Pencil, Trash2, LayoutTemplate } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Modal,
  Spinner,
} from "@pos/ui";
import { useMenuCategories } from "@/features/menu/hooks/useMenuCategories";
import { useAddCategory } from "@/features/menu/hooks/useAddCategory";
import { useRenameCategory } from "@/features/menu/hooks/useRenameCategory";
import { useDeleteCategory } from "@/features/menu/hooks/useDeleteCategory";
import type { MenuCategory } from "@pos/types";

interface Props {
  onSaveTemplate: (category: { id: string; name: string }) => void;
}

export const MenuCategoriesSection = ({ onSaveTemplate }: Props) => {
  const { data: categories, isLoading } = useMenuCategories();
  const addMutation = useAddCategory();
  const renameMutation = useRenameCategory();
  const deleteMutation = useDeleteCategory();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [name, setName] = useState("");

  const openAdd = () => {
    setName("");
    setAdding(true);
  };
  const openEdit = (category: MenuCategory) => {
    setName(category.name);
    setEditing(category);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Categories
          </h2>
          <p className="text-sm text-text-secondary">
            Organize menu items into customer-facing groups.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      ) : !categories?.length ? (
        <EmptyState
          icon={({ className }) => <span className={className}>☷</span>}
          title="No categories"
          description="Create your first category to start organizing menu items."
          action={<Button onClick={openAdd}>Add Category</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {category.menuItems?.length ?? 0} items
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <IconButton
                    icon={Pencil}
                    size="sm"
                    aria-label={`Rename ${category.name}`}
                    onClick={() => openEdit(category)}
                  />
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    aria-label={`Delete ${category.name}`}
                    onClick={() => {
                      if (confirm(`Remove category "${category.name}"?`))
                        deleteMutation.mutate(category.id);
                    }}
                  />
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                size="sm"
                variant="secondary"
                onClick={() =>
                  onSaveTemplate({ id: category.id, name: category.name })
                }
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> Save as Template
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={adding || !!editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        title={adding ? "Add Category" : "Rename Category"}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Category name"
            placeholder="e.g. Starters"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={addMutation.isPending || renameMutation.isPending}
              disabled={!name.trim()}
              onClick={() => {
                if (adding)
                  addMutation.mutate(name.trim(), {
                    onSuccess: () => {
                      setAdding(false);
                      setName("");
                    },
                  });
                else if (editing)
                  renameMutation.mutate(
                    { id: editing.id, name: name.trim() },
                    {
                      onSuccess: () => {
                        setEditing(null);
                        setName("");
                      },
                    },
                  );
              }}
            >
              {adding ? "Add Category" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
