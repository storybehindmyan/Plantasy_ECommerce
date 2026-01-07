/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { db, storage } from "../../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";

type CategoryDoc = {
  id: string; // docId
  name: string;
  iconImage: string;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

type CategoryFormData = {
  name: string;
  iconImage: string;
};

const generateCategoryId = () => {
  const random4 = `${Math.floor(Math.random() * 10000)}`.padStart(4, "0");
  return `CAT00${random4}`;
};

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDoc | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    iconImage: "",
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>("");

  useEffect(() => {
    void fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(collection(db, "categories"));
      const list: CategoryDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          name: data.name,
          iconImage: data.iconImage,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setCategories(list);
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (ts?: Timestamp | Date) => {
    if (!ts) return "-";
    let date: Date | null = null;
    if (typeof (ts as any)?.toDate === "function") {
      date = (ts as any).toDate();
    } else if (ts instanceof Date) {
      date = ts;
    }
    return date ? date.toLocaleString() : "-";
  };

  const handleOpenModal = (category?: CategoryDoc) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        iconImage: category.iconImage,
      });
      setIconPreview(category.iconImage);
      setIconFile(null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        iconImage: "",
      });
      setIconPreview("");
      setIconFile(null);
    }
    setShowModal(true);
  };

  const handleIconSelected = (file: File | null) => {
    if (!file) return;
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setIconPreview((e.target?.result as string) || "");
    };
    reader.readAsDataURL(file);
  };

  const uploadIconIfNeeded = async (
    currentIcon: string | null,
    categoryId: string
  ): Promise<string> => {
    if (!iconFile) {
      return currentIcon || "";
    }
    try {
      const iconRef = ref(
        storage,
        `categories/${categoryId}-${Date.now()}-${iconFile.name}`
      );
      const snapshot = await uploadBytes(iconRef, iconFile);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err) {
      console.error("Error uploading icon image", err);
      return currentIcon || "";
    }
  };

  const ensureUniqueCategoryName = async (
    name: string,
    currentId?: string
  ) => {
    const q = query(
      collection(db, "categories"),
      where("name", "==", name.trim())
    );
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (snap.size === 1 && currentId) {
      const docId = snap.docs[0].id;
      return docId === currentId;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsLoading(true);

      const nameTrimmed = formData.name.trim();

      const uniqueName = await ensureUniqueCategoryName(
        nameTrimmed,
        editingCategory?.id
      );
      if (!uniqueName) {
        alert("Category name must be unique.");
        setIsLoading(false);
        return;
      }

      const categoryId = editingCategory
        ? editingCategory.id
        : generateCategoryId();

      const finalIconUrl = await uploadIconIfNeeded(
        editingCategory?.iconImage ?? null,
        categoryId
      );

      const baseData: any = {
        name: nameTrimmed,
        iconImage: finalIconUrl || formData.iconImage || "",
        isActive: editingCategory?.isActive ?? true,
      };

      const catRef = doc(db, "categories", categoryId);

      if (editingCategory) {
        await updateDoc(catRef, {
          ...baseData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(catRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      setIconFile(null);
      setIconPreview("");
      await fetchCategories();
    } catch (err) {
      console.error("Error saving category", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (category: CategoryDoc) => {
    try {
      await updateDoc(doc(db, "categories", category.id), {
        isActive: !category.isActive,
        updatedAt: serverTimestamp(),
      });
      await fetchCategories();
    } catch (err) {
      console.error("Error toggling category", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setDeleteConfirm(null);
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category", err);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (cat: CategoryDoc) => (
        <div className="flex items-center gap-3">
          {cat.iconImage ? (
            <img
              src={cat.iconImage}
              alt={cat.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">N/A</span>
            </div>
          )}
          <div>
            <p className="font-medium">{cat.name}</p>
            <p className="text-xs text-muted-foreground">{cat.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (cat: CategoryDoc) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={cat.isActive ? "active" : "inactive"} />
          <button
            onClick={() => handleToggleActive(cat)}
            className="admin-btn-ghost p-1"
            title={cat.isActive ? "Deactivate" : "Activate"}
          >
            {cat.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (cat: CategoryDoc) => (
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(cat.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (cat: CategoryDoc) => (
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(cat.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (cat: CategoryDoc) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(cat)}
            className="admin-btn-ghost p-2"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(cat.id)}
            className="admin-btn-ghost p-2 text-destructive"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">
            Create, edit and manage product categories
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="admin-btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        isLoading={isLoading}
        emptyMessage="No categories found"
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="admin-input"
              required
            />
          </div>

          <div>
            <label className="admin-label">Icon Image</label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                const input = document.getElementById(
                  "category-icon-input"
                ) as HTMLInputElement | null;
                input?.click();
              }}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload icon (optional)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: square image, small size
              </p>
              <input
                id="category-icon-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleIconSelected(e.target.files?.[0] || null)
                }
              />
            </div>

            {iconPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={iconPreview}
                  alt="Icon preview"
                  className="w-12 h-12 rounded-lg object-cover border border-border"
                />
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={() => {
                    setIconFile(null);
                    setIconPreview("");
                    if (!editingCategory) {
                      setFormData((prev) => ({
                        ...prev,
                        iconImage: "",
                      }));
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {editingCategory && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Created on:</span>{" "}
                {formatTimestamp(editingCategory.createdAt)}
              </p>
              <p>
                <span className="font-medium">Last updated:</span>{" "}
                {formatTimestamp(editingCategory.updatedAt)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="admin-btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              {editingCategory ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Category"
        size="sm"
      >
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this category? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="admin-btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="admin-btn-danger"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
