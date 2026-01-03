/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Blog } from '../../types';
// import { blogService } from '../../services/blogService';
import { db, storage } from '../../firebase/firebaseConfig'; // adjust path
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

type BlogWithMeta = Blog & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string; // URL (final)
  author: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  galleryImages: string[]; // URLs (final)
};

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogWithMeta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    seoTitle: '',
    seoDescription: '',
    isPublished: false,
    galleryImages: [],
  });

  // local cover image file + preview
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  // local gallery images (existing URLs + new files)
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(collection(db, 'blogs'));
      const list: BlogWithMeta[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          author: data.author,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          isPublished: data.isPublished,
          galleryImages: data.galleryImages || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setBlogs(list);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleOpenModal = (blog?: BlogWithMeta) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage,
        author: blog.author,
        seoTitle: blog.seoTitle,
        seoDescription: blog.seoDescription,
        isPublished: blog.isPublished,
        galleryImages: blog.galleryImages || [],
      });
      setCoverFile(null);
      setCoverPreview(blog.coverImage || '');
      setExistingGalleryUrls(blog.galleryImages || []);
      setGalleryFiles([]);
      setGalleryPreviews(blog.galleryImages || []);
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        author: '',
        seoTitle: '',
        seoDescription: '',
        isPublished: false,
        galleryImages: [],
      });
      setCoverFile(null);
      setCoverPreview('');
      setExistingGalleryUrls([]);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    }
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      seoTitle: prev.seoTitle || title,
    }));
  };

  // simple compression via canvas for images [web:38][web:47]
  const compressImage = async (file: File, quality = 0.7): Promise<File> => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / imageBitmap.width);
    canvas.width = imageBitmap.width * scale;
    canvas.height = imageBitmap.height * scale;

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b as Blob),
        'image/jpeg',
        quality
      )
    );

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
      type: 'image/jpeg',
    });
  };

  const handleCoverSelected = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelected = (files: FileList | null) => {
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
        setGalleryFiles((prev) => [...prev, ...newFiles]);
        const updatedPreviews = [...galleryPreviews, ...results];
        setGalleryPreviews(updatedPreviews);
      })
      .catch((err) => console.error('Error reading gallery files', err));
  };

  const handleRemoveGalleryImage = (index: number) => {
    const preview = galleryPreviews[index];
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryPreviews(newPreviews);

    if (existingGalleryUrls.includes(preview)) {
      const remaining = existingGalleryUrls.filter((url) => url !== preview);
      setExistingGalleryUrls(remaining);
      setFormData((prev) => ({
        ...prev,
        galleryImages: remaining,
      }));
    } else {
      const offset = index - existingGalleryUrls.length;
      if (offset >= 0) {
        const newFileList = [...galleryFiles];
        newFileList.splice(offset, 1);
        setGalleryFiles(newFileList);
      }
    }
  };

  const uploadCoverImage = async (blogId: string): Promise<string> => {
    // if no new cover selected, use existing
    if (!coverFile) return coverPreview || '';

    const compressed = await compressImage(coverFile, 0.7);
    const coverRef = ref(
      storage,
      `blogs/${blogId}/images/cover-${Date.now()}-${compressed.name}`
    );
    const snapshot = await uploadBytes(coverRef, compressed);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  };

  const uploadGalleryImages = async (blogId: string): Promise<string[]> => {
    const urls: string[] = [...existingGalleryUrls];
    for (const file of galleryFiles) {
      try {
        const compressed = await compressImage(file, 0.7);
        const imgRef = ref(
          storage,
          `blogs/${blogId}/images/gallery-${Date.now()}-${compressed.name}`
        );
        const snapshot = await uploadBytes(imgRef, compressed);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
      } catch (err) {
        console.error('Error uploading gallery image', err);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const blogId = editingBlog ? editingBlog.id : doc(collection(db, 'blogs')).id;

      const [coverUrl, galleryUrls] = await Promise.all([
        uploadCoverImage(blogId),
        uploadGalleryImages(blogId),
      ]);

      const blogData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        coverImage: coverUrl,
        author: formData.author,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        isPublished: formData.isPublished,
        galleryImages: galleryUrls,
      };

      const blogRef = doc(db, 'blogs', blogId);

      if (editingBlog) {
        await updateDoc(blogRef, {
          ...blogData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(blogRef, {
          ...blogData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      setCoverFile(null);
      setCoverPreview('');
      setExistingGalleryUrls([]);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      await fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blogs', id));
      setDeleteConfirm(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleTogglePublish = async (blog: BlogWithMeta) => {
    try {
      await updateDoc(doc(db, 'blogs', blog.id), {
        isPublished: !blog.isPublished,
        updatedAt: serverTimestamp(),
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error toggling blog publish status:', error);
    }
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (ts?: Timestamp) => {
    if (!ts) return '-';
    const date = ts.toDate(); // Firestore Timestamp -> JS Date[web:62][web:53]
    return date.toLocaleString();
  };

  const columns = [
    {
      key: 'title',
      header: 'Blog Post',
      render: (blog: BlogWithMeta) => (
        <div className="flex items-center gap-3">
          {blog.coverImage ? (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">N/A</span>
            </div>
          )}
          <div>
            <p className="font-medium line-clamp-1">{blog.title}</p>
            <p className="text-xs text-muted-foreground">{blog.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (blog: BlogWithMeta) => (
        <span className="text-sm font-mono text-muted-foreground">
          /{blog.slug}
        </span>
      ),
    },
    {
      key: 'isPublished',
      header: 'Status',
      render: (blog: BlogWithMeta) => (
        <StatusBadge status={blog.isPublished ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (blog: BlogWithMeta) => (
        <span className="text-muted-foreground text-sm">
          {blog.createdAt ? formatTimestamp(blog.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (blog: BlogWithMeta) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTogglePublish(blog)}
            className="admin-btn-ghost p-2"
            title={blog.isPublished ? 'Unpublish' : 'Publish'}
          >
            {blog.isPublished ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleOpenModal(blog)}
            className="admin-btn-ghost p-2"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(blog.id)}
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
          <h1 className="page-title">Blogs</h1>
          <p className="page-subtitle">Manage blog posts and articles</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-primary">
          <Plus className="w-5 h-5" />
          New Post
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Blogs Table */}
      <DataTable
        columns={columns}
        data={filteredBlogs}
        isLoading={isLoading}
        emptyMessage="No blog posts found"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="admin-input font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Cover Image</label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCoverSelected(e.dataTransfer.files);
                }}
                onClick={() => {
                  const input = document.getElementById(
                    'blog-cover-input'
                  ) as HTMLInputElement | null;
                  input?.click();
                }}
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop cover image here, or click to browse
                </p>
                <input
                  id="blog-cover-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverSelected(e.target.files)}
                />
              </div>
              {coverPreview && (
                <div className="mt-3">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="admin-label">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              className="admin-input min-h-[80px] resize-y"
              required
            />
          </div>

          <div>
            <label className="admin-label">Content (HTML/Markdown)</label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="admin-input min-h-[200px] resize-y font-mono text-sm"
              required
            />
          </div>

          {/* Gallery images */}
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-3">Gallery Images</h3>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleGallerySelected(e.dataTransfer.files);
              }}
              onClick={() => {
                const input = document.getElementById(
                  'blog-gallery-input'
                ) as HTMLInputElement | null;
                input?.click();
              }}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop gallery images here, or click to browse
              </p>
              <input
                id="blog-gallery-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleGallerySelected(e.target.files)}
              />
            </div>

            {galleryPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-3">
                {galleryPreviews.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-background/80 rounded-full px-2 text-xs opacity-0 group-hover:opacity-100 transition"
                      title="Remove"
                      onClick={() => handleRemoveGalleryImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEO Fields */}
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-3">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">SEO Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, seoTitle: e.target.value })
                  }
                  className="admin-input"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seoTitle.length}/60 characters
                </p>
              </div>
              <div>
                <label className="admin-label">SEO Description</label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seoDescription: e.target.value,
                    })
                  }
                  className="admin-input min-h-[80px] resize-y"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seoDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          {editingBlog && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Created on:</span>{' '}
                {formatTimestamp(editingBlog.createdAt)}
              </p>
              <p>
                <span className="font-medium">Last updated:</span>{' '}
                {formatTimestamp(editingBlog.updatedAt)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData({ ...formData, isPublished: e.target.checked })
              }
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="isPublished" className="text-sm">
              Publish immediately
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
              {editingBlog ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Blog Post"
        size="sm"
      >
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this blog post? This action cannot be
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

export default BlogsPage;
