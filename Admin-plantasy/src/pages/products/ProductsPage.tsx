/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Star,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import { Product } from "../../types";
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

type Category = {
  id: string;
  name: string;
};

type PlantType = "Soil-less" | "Soil-Base" | "Both" | "None of the above";
type PolicyType = "return" | "replacement" | "both" | "none";

type ProductFormData = {
  name: string;
  sku: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  category: string;
  plantType: PlantType | "";
  policy: PolicyType | "";
  volume: string;
  isActive: boolean;
  coverImage: string;
  hoverImage: string;
  images: string[];
};

type ProductWithMeta = Omit<Product, "createdAt" | "updatedAt"> & {
  sku: string;
  coverImage?: string;
  hoverImage?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  volume?: string | number;
};

type SortOption =
  | "none"
  | "stock-asc"
  | "updated-latest"
  | "updated-oldest"
  | "price-asc"
  | "price-desc";

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithMeta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    category: "",
    plantType: "",
    policy: "",
    volume: "",
    isActive: true,
    coverImage: "",
    hoverImage: "",
    images: [],
  });

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    // Initialize sortBy from ?sort= query param if valid
    const sortParam = searchParams.get("sort");
    if (
      sortParam === "stock-asc" ||
      sortParam === "updated-latest" ||
      sortParam === "updated-oldest" ||
      sortParam === "price-asc" ||
      sortParam === "price-desc"
    ) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, "categories"));
      const cats: Category[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        cats.push({ id: d.id, name: data.name });
      });
      setCategories(cats);
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(collection(db, "products"));
      const prods: ProductWithMeta[] = [];

      const now = new Date();
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

      snap.forEach((d) => {
        const data = d.data() as any;

        const updatedAt: Timestamp | undefined = data.updatedAt;
        const hasDiscount =
          typeof data.discountPrice === "number" &&
          data.discountPrice !== null;
        let isNewArrival = false;

        if (updatedAt && (updatedAt as any).toDate) {
          const updatedDate = updatedAt.toDate() as Date;
          const diffMs = now.getTime() - updatedDate.getTime();
          isNewArrival = diffMs <= tenDaysMs && diffMs >= 0;
        }

        const images: string[] = data.images || [];
        const coverImage = data.coverImage || images[0] || "";
        const hoverImage = data.hoverImage || images[1] || images[0] || "";

        prods.push({
          id: d.id,
          name: data.name,
          description: data.description,
          price: data.price,
          discountPrice: data.discountPrice ?? null,
          stock: data.stock,
          category: data.category,
          sku: data.sku,
          plantType: data.plantType,
          policy: data.policy,
          isActive: data.isActive,
          images,
          coverImage,
          hoverImage,
          createdAt: data.createdAt,
          updatedAt,
          isNewArrival,
          isOnSale: hasDiscount,
          volume: data.volume,
        });
      });

      setProducts(prods);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateProductId = () => {
    const random = Math.floor(10000000 + Math.random() * 90000000);
    return `PROD00${random}`;
  };

  const generateSku = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `SKU-${random}`;
  };

  const compressImage = async (file: File, quality = 0.7): Promise<File> => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / imageBitmap.width);
    canvas.width = imageBitmap.width * scale;
    canvas.height = imageBitmap.height * scale;

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", quality)
    );

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const handleOpenModal = (product?: ProductWithMeta) => {
    if (product) {
      setEditingProduct(product);
      const imgs = product.images || [];
      const cover = product.coverImage || imgs[0] || "";
      const hover = product.hoverImage || "";
      setFormData({
        name: product.name,
        sku: product.sku || "",
        description: product.description,
        price: product.price.toString(),
        discountPrice:
          product.discountPrice !== null &&
          product.discountPrice !== undefined
            ? product.discountPrice.toString()
            : "",
        stock: product.stock.toString(),
        category: product.category,
        plantType: (product.plantType as PlantType) || "",
        policy: (product.policy as PolicyType) || "",
        volume:
          product.volume !== undefined && product.volume !== null
            ? String(product.volume)
            : "",
        isActive: product.isActive,
        coverImage: cover,
        hoverImage: hover,
        images: imgs,
      });
      setExistingImageUrls(imgs);
      setImageFiles([]);
      setImagePreviews(imgs);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        description: "",
        price: "",
        discountPrice: "",
        stock: "",
        category: "",
        plantType: "",
        policy: "",
        volume: "",
        isActive: true,
        coverImage: "",
        hoverImage: "",
        images: [],
      });
      setExistingImageUrls([]);
      setImageFiles([]);
      setImagePreviews([]);
    }
    setShowModal(true);
  };

  const handleImagesSelected = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newFiles: File[] = [];
    const readers: Promise<string>[] = [];

    fileArray.forEach((file) => {
      newFiles.push(file);
      readers.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        })
      );
    });

    Promise.all(readers)
      .then((results) => {
        setImageFiles((prev) => [...prev, ...newFiles]);
        const updatedPreviews = [...imagePreviews, ...results];
        setImagePreviews(updatedPreviews);
      })
      .catch((err) => console.error("Error reading files", err));
  };

  const handleRemoveImage = (index: number) => {
    const preview = imagePreviews[index];

    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);

    if (existingImageUrls.includes(preview)) {
      const newExisting = existingImageUrls.filter((url) => url !== preview);
      setExistingImageUrls(newExisting);
      setFormData((prev) => ({
        ...prev,
        images: newExisting,
        coverImage:
          prev.coverImage === preview ? newExisting[0] || "" : prev.coverImage,
        hoverImage:
          prev.hoverImage === preview
            ? newExisting[1] || newExisting[0] || ""
            : prev.hoverImage,
      }));
    } else {
      const offset = index - existingImageUrls.length;
      if (offset >= 0) {
        const newFileList = [...imageFiles];
        newFileList.splice(offset, 1);
        setImageFiles(newFileList);
      }
    }
  };

  const handleSetCover = (index: number) => {
    const newCover = imagePreviews[index];
    setFormData((prev) => ({
      ...prev,
      coverImage: newCover,
    }));
  };

  const handleSetHover = (index: number) => {
    const newHover = imagePreviews[index];
    setFormData((prev) => ({
      ...prev,
      hoverImage: newHover,
    }));
  };

  const uploadImagesAndGetUrls = async (productId: string) => {
    const urls: string[] = [...existingImageUrls];
    for (const file of imageFiles) {
      try {
        const compressed = await compressImage(file, 0.7);
        const imageRef = ref(
          storage,
          `products/${productId}/images/${Date.now()}-${compressed.name}`
        );
        const snapshot = await uploadBytes(imageRef, compressed);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
      } catch (err) {
        console.error("Error uploading image", err);
      }
    }
    return urls;
  };

  const isDiscountProvided = (value: string) =>
    value !== "" && value !== null && value !== undefined;

  const ensureUniqueSku = async (sku: string, currentId?: string) => {
    const q = query(
      collection(db, "products"),
      where("sku", "==", sku.trim())
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
    if (!formData.category) return;
    if (!formData.plantType) return;
    if (!formData.policy) return;
    if (!formData.name.trim()) return;

    try {
      setIsLoading(true);

      const productId = editingProduct ? editingProduct.id : generateProductId();

      let finalSku = formData.sku.trim();
      if (!finalSku) {
        finalSku = generateSku();
      }
      const skuIsUnique = await ensureUniqueSku(finalSku, editingProduct?.id);
      if (!skuIsUnique) {
        alert("SKU must be unique. Please enter a different SKU.");
        setIsLoading(false);
        return;
      }

      const allImageUrls = await uploadImagesAndGetUrls(productId);

      let coverImageUrl = formData.coverImage;
      let hoverImageUrl = formData.hoverImage;

      if (!coverImageUrl || !allImageUrls.includes(coverImageUrl)) {
        coverImageUrl = allImageUrls[0] || "";
      }

      if (!hoverImageUrl || !allImageUrls.includes(hoverImageUrl)) {
        hoverImageUrl = allImageUrls[1] || allImageUrls[0] || "";
      }

      const discountPriceNumber = isDiscountProvided(formData.discountPrice)
        ? parseFloat(formData.discountPrice)
        : null;

      const volumeValue =
        formData.volume.trim() === "" ? null : formData.volume.trim();

      const baseData: any = {
        name: formData.name.trim(),
        sku: finalSku,
        description: formData.description,
        price: parseFloat(formData.price),
        discountPrice: discountPriceNumber,
        stock: parseInt(formData.stock),
        category: formData.category,
        plantType: formData.plantType,
        policy: formData.policy,
        volume: volumeValue,
        isActive: formData.isActive,
        images: allImageUrls,
        coverImage: coverImageUrl,
        hoverImage: hoverImageUrl,
      };

      const productRef = doc(db, "products", productId);

      if (editingProduct) {
        await updateDoc(productRef, {
          ...baseData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(productRef, {
          ...baseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      setExistingImageUrls([]);
      setImageFiles([]);
      setImagePreviews([]);
      await fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleToggleActive = async (product: ProductWithMeta) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isActive: !product.isActive,
        updatedAt: serverTimestamp(),
      });
      fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
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

  const filteredAndSortedProducts = useMemo(() => {
    let list = products.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesText =
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.sku || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      return matchesText && matchesCategory;
    });

    switch (sortBy) {
      case "stock-asc":
        list = [...list].sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
        break;
      case "updated-latest":
        list = [...list].sort((a, b) => {
          const da =
            a.updatedAt && (a.updatedAt as any).toDate
              ? (a.updatedAt as Timestamp).toDate().getTime()
              : a.updatedAt instanceof Date
              ? a.updatedAt.getTime()
              : 0;
          const db =
            b.updatedAt && (b.updatedAt as any).toDate
              ? (b.updatedAt as Timestamp).toDate().getTime()
              : b.updatedAt instanceof Date
              ? b.updatedAt.getTime()
              : 0;
          return db - da;
        });
        break;
      case "updated-oldest":
        list = [...list].sort((a, b) => {
          const da =
            a.updatedAt && (a.updatedAt as any).toDate
              ? (a.updatedAt as Timestamp).toDate().getTime()
              : a.updatedAt instanceof Date
              ? a.updatedAt.getTime()
              : 0;
          const db =
            b.updatedAt && (b.updatedAt as any).toDate
              ? (b.updatedAt as Timestamp).toDate().getTime()
              : b.updatedAt instanceof Date
              ? b.updatedAt.getTime()
              : 0;
          return da - db;
        });
        break;
      case "price-asc":
        list = [...list].sort(
          (a, b) => (a.price ?? 0) - (b.price ?? 0)
        );
        break;
      case "price-desc":
        list = [...list].sort(
          (a, b) => (b.price ?? 0) - (a.price ?? 0)
        );
        break;
      case "none":
      default:
        break;
    }

    return list;
  }, [products, searchQuery, categoryFilter, sortBy]);

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (product: ProductWithMeta) => (
        <div className="flex items-center gap-3">
          {product.coverImage || product.images?.[0] ? (
            <img
              src={product.coverImage || product.images[0]}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">N/A</span>
            </div>
          )}
          <div>
            <p className="flex items-center gap-2 font-medium">
              {product.name}
              {product.isNewArrival && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  New Arrival
                </span>
              )}
              {product.isOnSale && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  Sale
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.category} · {product.sku}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (product: ProductWithMeta) => (
        <div>
          {product.discountPrice !== null &&
          product.discountPrice !== undefined ? (
            <>
              <span className="font-medium">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="ml-2 line-through text-xs text-muted-foreground">
                ₹{product.discountPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-medium">
              ₹{product.price.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product: ProductWithMeta) => (
        <span
          className={
            product.stock <= 10 ? "font-medium text-destructive" : ""
          }
        >
          {product.stock}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (product: ProductWithMeta) => (
        <StatusBadge status={product.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (product: ProductWithMeta) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleActive(product)}
            className="admin-btn-ghost p-2"
            title={product.isActive ? "Disable" : "Enable"}
          >
            {product.isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => handleOpenModal(product)}
            className="admin-btn-ghost p-2"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(product.id)}
            className="admin-btn-ghost p-2 text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-primary">
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mr-2 text-xs text-muted-foreground">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-input h-9 py-1 text-sm"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mr-2 text-xs text-muted-foreground">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="admin-input h-9 py-1 text-sm"
            >
              <option value="none">Default</option>
              <option value="stock-asc">Stock (low to high)</option>
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
              <option value="updated-latest">Latest updated</option>
              <option value="updated-oldest">Least updated</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAndSortedProducts}
        isLoading={isLoading}
        emptyMessage="No products found"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + SKU */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="admin-label">Product Name</label>
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
              <label className="admin-label">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="admin-input"
                placeholder="Unique SKU (e.g., PLANT-001)"
              />
            </div>
          </div>

          {/* Category + Plant type + Policy */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="admin-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="admin-input"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Plant type</label>
              <select
                value={formData.plantType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    plantType: e.target.value as PlantType | "",
                  })
                }
                className="admin-input"
                required
              >
                <option value="">Select plant type</option>
                <option value="Soil-less">Soil-less</option>
                <option value="Soil-Base">Soil-Base</option>
                <option value="Both">Both</option>
                <option value="None of the above">
                  None of the above
                </option>
              </select>
            </div>
            <div>
              <label className="admin-label">Select policy</label>
              <select
                value={formData.policy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    policy: e.target.value as PolicyType | "",
                  })
                }
                className="admin-input"
                required
              >
                <option value="">Select policy</option>
                <option value="return">Return</option>
                <option value="replacement">Replacement</option>
                <option value="both">Both</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="admin-input min-h-[100px] resize-y"
              required
            />
          </div>

          {/* Pricing + Stock + Volume */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="admin-label">Selling price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Discount price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.discountPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPrice: e.target.value,
                  })
                }
                className="admin-input"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="admin-label">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Volume</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) =>
                  setFormData({ ...formData, volume: e.target.value })
                }
                className="admin-input"
                placeholder="e.g., 500 ml, 1 L"
              />
            </div>
          </div>

          {/* Images uploader */}
          <div>
            <label className="admin-label">Product Images</label>

            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleImagesSelected(e.dataTransfer.files);
              }}
              onClick={() => {
                const input = document.getElementById(
                  "product-images-input"
                ) as HTMLInputElement | null;
                input?.click();
              }}
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop images here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select cover and hover images
              </p>
              <input
                id="product-images-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImagesSelected(e.target.files)}
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-4">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="group relative">
                    <img
                      src={src}
                      alt={`Product ${index + 1}`}
                      className={`h-24 w-full rounded-lg border object-cover ${
                        formData.coverImage === src
                          ? "border-primary ring-2 ring-primary/50"
                          : formData.hoverImage === src
                          ? "border-secondary ring-2 ring-secondary/50"
                          : "border-border"
                      }`}
                    />
                    {formData.coverImage === src && (
                      <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        <Star className="h-3 w-3" /> Cover
                      </span>
                    )}
                    {formData.hoverImage === src &&
                      formData.coverImage !== src && (
                        <span className="absolute right-8 top-1 flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                          Hover
                        </span>
                      )}
                    <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded-full bg-background/80 p-1.5 text-xs hover:bg-primary/10"
                        title="Set as cover"
                        onClick={() => handleSetCover(index)}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-background/80 p-1.5 text-xs hover:bg-secondary/10"
                        title="Set as hover"
                        onClick={() => handleSetHover(index)}
                      >
                        H
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-background/80 p-1.5 text-xs text-destructive hover:bg-destructive/10"
                        title="Remove"
                        onClick={() => handleRemoveImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingProduct && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Created on:</span>{" "}
                {formatTimestamp(editingProduct.createdAt)}
              </p>
              <p>
                <span className="font-medium">Last updated:</span>{" "}
                {formatTimestamp(editingProduct.updatedAt)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm">
              Product is active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="admin-btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              {editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
        size="sm"
      >
        <p className="mb-6 text-muted-foreground">
          Are you sure you want to delete this product? This action cannot
          be undone.
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

export default ProductsPage;
