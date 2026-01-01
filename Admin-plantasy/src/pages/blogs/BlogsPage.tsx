import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Blog } from '../../types';
import { blogService } from '../../services/blogService';

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    author: '',
    seoTitle: '',
    seoDescription: '',
    isPublished: false,
    galleryImages: [] as string[],
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const { blogs } = await blogService.getBlogs(50);
      setBlogs(blogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (blog?: Blog) => {
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
    }
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: blogService.generateSlug(title),
      seoTitle: title,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const blogData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        coverImage: formData.coverImage,
        author: formData.author,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        isPublished: formData.isPublished,
        galleryImages: formData.galleryImages,
      };

      if (editingBlog) {
        await blogService.updateBlog(editingBlog.id, blogData);
      } else {
        await blogService.createBlog(blogData);
      }

      setShowModal(false);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await blogService.deleteBlog(id);
      setDeleteConfirm(null);
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleTogglePublish = async (blog: Blog) => {
    try {
      await blogService.updateBlog(blog.id, { isPublished: !blog.isPublished });
      fetchBlogs();
    } catch (error) {
      console.error('Error toggling blog publish status:', error);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'title',
      header: 'Blog Post',
      render: (blog: Blog) => (
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
      render: (blog: Blog) => (
        <span className="text-sm font-mono text-muted-foreground">/{blog.slug}</span>
      ),
    },
    {
      key: 'isPublished',
      header: 'Status',
      render: (blog: Blog) => (
        <StatusBadge status={blog.isPublished ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (blog: Blog) => (
        <span className="text-muted-foreground text-sm">
          {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (blog: Blog) => (
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
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Cover Image URL</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="admin-input"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="admin-input min-h-[80px] resize-y"
              required
            />
          </div>

          <div>
            <label className="admin-label">Content (HTML/Markdown)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="admin-input min-h-[200px] resize-y font-mono text-sm"
              required
            />
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
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  className="admin-input min-h-[80px] resize-y"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seoDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="isPublished" className="text-sm">Publish immediately</label>
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
          Are you sure you want to delete this blog post? This action cannot be undone.
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
