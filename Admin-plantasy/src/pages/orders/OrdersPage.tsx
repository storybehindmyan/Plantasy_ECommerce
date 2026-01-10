/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, ChevronDown } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { orderService } from '../../services/orderService';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = (typeof statusOptions)[number];

interface OrderItem {
  type: string;
  coverImage: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  productId: string;
}

interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  zip: string;
}

interface Payment {
  paymentId: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string;
}

interface Pricing {
  couponCode: string;
  discount: number;
  grandTotal: number;
  shippingCharge: number;
  subTotal: number;
  tax: number;
}

interface Timestamps {
  confirmedAt: { seconds: number; nanoseconds: number } | null;
  deliveredAt: { seconds: number; nanoseconds: number } | null;
  orderedAt: { seconds: number; nanoseconds: number } | null;
  shippedAt: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

interface Order {
  track: string;
  id: string;
  userId: string;
  orderId: string;
  // Stored in Firestore as UPPERCASE; UI uses lowercase type
  orderStatus: any;
  orderType: string;
  isCancelable: boolean;
  isReturnEligible: boolean;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  payment: Payment;
  pricing: Pricing;
  timestamps: Timestamps;
  createdAt: any;
  updatedAt: any;
}

type SortKey = 'createdAt' | 'grandTotal' | 'customer' | 'status';
type SortDirection = 'asc' | 'desc';

// Map UI (lowercase) -> API (uppercase)
const statusToApi: Record<OrderStatus, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

// Filter mode for multiple orders from same user
type UserFilterMode = 'all' | 'sameUserId' | 'sameName';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackInput, setTrackInput] = useState<string>(''); // local input state for track

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // New: user-based filter
  const [userFilterMode, setUserFilterMode] = useState<UserFilterMode>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // When opening/closing modal, sync local trackInput with selected order's track,
  // but do not modify any other data coming from Firestore.
  useEffect(() => {
    if (selectedOrder) {
      setTrackInput(selectedOrder.track || '');
    } else {
      setTrackInput('');
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Convert UI filter (lowercase) to uppercase Firestore value
      const filterValue = statusFilter
        ? statusToApi[statusFilter as OrderStatus]
        : undefined;

      const { orders: fetchedOrders } = await orderService.getOrders(
        50,
        null,
        filterValue
      );

      const mappedOrders: Order[] = fetchedOrders.map((order: any) => ({
        ...order,
        userId: order.userId || '',
        orderType: order.orderType || 'standard',
        isCancelable: order.isCancelable ?? true,
        isReturnEligible: order.isReturnEligible ?? false,
        payment: order.payment || {
          paymentId: '',
          paymentMethod: '',
          paymentStatus: '',
          transactionRef: '',
        },
        track: order.track || '',
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
    order: Order
  ) => {
    // Use current trackInput value; do not mutate other order fields.
    if (newStatus === 'shipped' && !trackInput.trim()) {
      alert('Please add a valid tracking URL before marking this order as shipped.');
      return;
    }

    // Persist track if changed
    if (trackInput !== (order.track || '')) {
      await orderService.updateOrderTrack(orderId, trackInput.trim());
    }

    const apiStatus = statusToApi[newStatus];
    await orderService.updateOrderStatus(orderId, apiStatus as any);
    await fetchOrders();
    setSelectedOrder(null);
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      await orderService.downloadInvoice(order.id);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number } | null) => {
    if (!timestamp) return '-';
    return new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000
    ).toLocaleDateString();
  };

  const toggleSort = (key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDirection('asc');
        return key;
      }
      setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      return prevKey;
    });
  };

  const filteredAndSortedOrders = useMemo(() => {
    // Base search filter
    const q = searchQuery.trim().toLowerCase();
    const searched = orders.filter((order) => {
      if (!q) return true;
      const fullName = `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.orderId.toLowerCase().includes(q) ||
        order.userId.toLowerCase().includes(q)
      );
    });

    // User-based filter (multiple orders from same uid or same name)
    const userFiltered = (() => {
      if (!selectedOrder || userFilterMode === 'all') return searched;

      if (userFilterMode === 'sameUserId') {
        return searched.filter((o) => o.userId && o.userId === selectedOrder.userId);
      }

      if (userFilterMode === 'sameName') {
        const selName = `${selectedOrder.deliveryAddress.firstName} ${selectedOrder.deliveryAddress.lastName}`
          .trim()
          .toLowerCase();
        return searched.filter((o) => {
          const name = `${o.deliveryAddress.firstName} ${o.deliveryAddress.lastName}`
            .trim()
            .toLowerCase();
          return name === selName;
        });
      }

      return searched;
    })();

    const sorted = [...userFiltered].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortKey) {
        case 'createdAt': {
          const aTime = a.timestamps.orderedAt
            ? a.timestamps.orderedAt.seconds * 1000 +
              a.timestamps.orderedAt.nanoseconds / 1_000_000
            : 0;
          const bTime = b.timestamps.orderedAt
            ? b.timestamps.orderedAt.seconds * 1000 +
              b.timestamps.orderedAt.nanoseconds / 1_000_000
            : 0;
          aVal = aTime;
          bVal = bTime;
          break;
        }
        case 'grandTotal':
          aVal = a.pricing.grandTotal ?? 0;
          bVal = b.pricing.grandTotal ?? 0;
          break;
        case 'customer': {
          const aName = `${a.deliveryAddress.firstName} ${a.deliveryAddress.lastName}`.toLowerCase();
          const bName = `${b.deliveryAddress.firstName} ${b.deliveryAddress.lastName}`.toLowerCase();
          aVal = aName;
          bVal = bName;
          break;
        }
        case 'status':
          aVal = a.orderStatus;
          bVal = b.orderStatus;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [orders, searchQuery, sortKey, sortDirection, selectedOrder, userFilterMode]);

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      onHeaderClick: () => toggleSort('createdAt'),
      render: (order: Order) => (
        <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      onHeaderClick: () => toggleSort('customer'),
      render: (order: Order) => (
        <div>
          <p className="font-medium">
            {order.deliveryAddress.firstName} {order.deliveryAddress.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.deliveryAddress.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: Order) => <span>{order.items.length} item(s)</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      onHeaderClick: () => toggleSort('grandTotal'),
      render: (order: Order) => (
        <span className="font-medium">
          ₹{order.pricing.grandTotal.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      onHeaderClick: () => toggleSort('status'),
      render: (order: Order) => (
        <StatusBadge
          status={String(order.orderStatus).toLowerCase() as OrderStatus}
        />
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order: Order) => (
        <StatusBadge
          status={String(order.payment.paymentStatus).toLowerCase() as OrderStatus}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      onHeaderClick: () => toggleSort('createdAt'),
      render: (order: Order) => (
        <span className="text-muted-foreground text-sm">
          {formatTimestamp(order.timestamps.orderedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: Order) => (
        <button
          onClick={() => setSelectedOrder(order)}
          className="admin-btn-ghost p-2"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID, user ID, or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | '')
            }
            className="admin-input appearance-none pr-10 min-w-[160px]"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>

        {/* User Filter */}
        <div className="relative">
          <select
            value={userFilterMode}
            onChange={(e) => setUserFilterMode(e.target.value as UserFilterMode)}
            className="admin-input appearance-none pr-10 min-w-[200px]"
          >
            <option value="all">All Users</option>
            <option value="sameUserId" disabled={!selectedOrder}>
              Same User ID as selected
            </option>
            <option value="sameName" disabled={!selectedOrder}>
              Same Name as selected
            </option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredAndSortedOrders}
        isLoading={isLoading}
        emptyMessage="No orders found"
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={
          selectedOrder ? `Order #${selectedOrder.id.slice(0, 8)}` : 'Order Details'
        }
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status Update + Invoice */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <StatusBadge
                  status={String(selectedOrder.orderStatus).toLowerCase() as OrderStatus}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative">
                  <select
                    value={String(selectedOrder.orderStatus).toLowerCase()}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedOrder.id,
                        e.target.value as OrderStatus,
                        selectedOrder
                      )
                    }
                    className="admin-input appearance-none pr-10"
                  >
                    {statusOptions.map((orderStatus) => (
                      <option key={orderStatus} value={orderStatus}>
                        {orderStatus.charAt(0).toUpperCase() +
                          orderStatus.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>

                {/* Download Invoice Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="admin-btn-outline whitespace-nowrap"
                >
                  Download Invoice
                </button>
              </div>
            </div>

            {/* Tracking URL input (new) */}
            <div>
              <h3 className="font-semibold mb-2">Tracking URL</h3>
              <input
                type="url"
                placeholder="https://tracking-url.com/..."
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                className="admin-input w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This link is required before changing status to shipped.
              </p>
            </div>

            {/* Keep the rest of your sections as they were: Customer Info, Shipping, Items, Pricing, Payment, Timeline */}
            {/* Customer Info */}
            <div>
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryAddress.firstName}{' '}
                    {selectedOrder.deliveryAddress.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryAddress.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-3">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p>{selectedOrder.deliveryAddress.addressLine1}</p>
                {selectedOrder.deliveryAddress.addressLine2 && (
                  <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                )}
                <p>
                  {selectedOrder.deliveryAddress.city},{' '}
                  {selectedOrder.deliveryAddress.region}{' '}
                  {selectedOrder.deliveryAddress.zip}
                </p>
                <p>{selectedOrder.deliveryAddress.country}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.coverImage}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                      {item.type === 'combo' ? ' (Customized)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Pricing Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    ₹{selectedOrder.pricing.subTotal.toLocaleString()}
                  </span>
                </div>
                {selectedOrder.pricing.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>
                      Discount ({selectedOrder.pricing.couponCode})
                    </span>
                    <span>
                      -₹{selectedOrder.pricing.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    ₹{selectedOrder.pricing.shippingCharge.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>
                    ₹{selectedOrder.pricing.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block">
                  Payment Method
                </span>
                <span className="font-medium">
                  {selectedOrder.payment.paymentMethod}
                </span>
              </div>
              <StatusBadge
                status={String(selectedOrder.payment.paymentStatus).toLowerCase() as OrderStatus}
              />
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-3">Order Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ordered</span>
                  <span>
                    {formatTimestamp(selectedOrder.timestamps.orderedAt)}
                  </span>
                </div>
                {selectedOrder.timestamps.confirmedAt && (
                  <div className="flex justify-between">
                    <span>Confirmed</span>
                    <span>
                      {formatTimestamp(selectedOrder.timestamps.confirmedAt)}
                    </span>
                  </div>
                )}
                {selectedOrder.timestamps.shippedAt && (
                  <div className="flex justify-between">
                    <span>Shipped</span>
                    <span>
                      {formatTimestamp(selectedOrder.timestamps.shippedAt)}
                    </span>
                  </div>
                )}
                {selectedOrder.timestamps.deliveredAt && (
                  <div className="flex justify-between">
                    <span>Delivered</span>
                    <span>
                      {formatTimestamp(selectedOrder.timestamps.deliveredAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
