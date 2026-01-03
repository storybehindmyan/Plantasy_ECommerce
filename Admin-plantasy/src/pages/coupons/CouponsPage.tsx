import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Copy } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Coupon, DiscountType } from '../../types';
import { couponService } from '../../services/couponService';

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as DiscountType,
    discountValue: '',
    minOrderValue: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const data = await couponService.getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue.toString(),
        expiryDate: coupon.expiryDate.toISOString().split('T')[0],
        usageLimit: coupon.usageLimit.toString(),
        isActive: coupon.isActive,
        applicableProducts: coupon.applicableProducts || [],
        applicableCategories: coupon.applicableCategories || [],
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        expiryDate: '',
        usageLimit: '',
        isActive: true,
        applicableProducts: [],
        applicableCategories: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: parseFloat(formData.minOrderValue),
        expiryDate: new Date(formData.expiryDate),
        usageLimit: parseInt(formData.usageLimit),
        isActive: formData.isActive,
        applicableProducts: formData.applicableProducts,
        applicableCategories: formData.applicableCategories,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, couponData);
      } else {
        await couponService.createCoupon(couponData);
      }

      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await couponService.deleteCoupon(id);
      setDeleteConfirm(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (coupon: Coupon) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium bg-muted px-2 py-1 rounded">
            {coupon.code}
          </span>
          <button
            onClick={() => copyCode(coupon.code)}
            className="admin-btn-ghost p-1"
            title="Copy code"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (coupon: Coupon) => (
        <span className="font-medium">
          {coupon.discountType === 'percentage' 
            ? `${coupon.discountValue}%` 
            : `₹${coupon.discountValue.toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'minOrderValue',
      header: 'Min Order',
      render: (coupon: Coupon) => (
        <span>₹{coupon.minOrderValue.toFixed(2)}</span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (coupon: Coupon) => (
        <span>{coupon.usedCount} / {coupon.usageLimit}</span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expires',
      render: (coupon: Coupon) => {
        const isExpired = new Date(coupon.expiryDate) < new Date();
        return (
          <span className={isExpired ? 'text-destructive' : ''}>
            {new Date(coupon.expiryDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (coupon: Coupon) => (
        <StatusBadge status={coupon.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (coupon: Coupon) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(coupon)}
            className="admin-btn-ghost p-2"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(coupon.id)}
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
          <h1 className="page-title">Coupons</h1>
          <p className="page-subtitle">Manage discount coupons</p>
        </div>
        <button onClick={() => handleOpenModal()} className="admin-btn-primary">
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <DataTable
        columns={columns}
        data={filteredCoupons}
        isLoading={isLoading}
        emptyMessage="No coupons found"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Coupon Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="admin-input font-mono"
                placeholder="SAVE20"
                required
              />
            </div>
            <div>
              <label className="admin-label">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                className="admin-input"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="admin-label">
                Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                step={formData.discountType === 'percentage' ? '1' : '0.01'}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Min Order Value (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div>
              <label className="admin-label">Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="admin-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Expiry Date</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="admin-input"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm">Coupon is active</label>
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
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Coupon"
        size="sm"
      >
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete this coupon? This action cannot be undone.
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

export default CouponsPage;
