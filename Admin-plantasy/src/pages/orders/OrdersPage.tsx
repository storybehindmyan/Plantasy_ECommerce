/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, ChevronDown, RefreshCw, Copy, ExternalLink, Truck, Package, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { orderService } from '../../services/orderService';
import { logisticsService } from '../../services/logisticsService';
import { toast } from 'sonner';

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

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
}

interface Order {
  track: string;
  id: string;
  userId: string;
  orderId: string;
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
  // Delivery & tracking
  deliveryMode?: string;
  estimatedDelivery?: string;
  waybill?: string;
  trackingUrl?: string;
  trackingEvents?: TrackingEvent[];
  shipmentStatus?: string;
  labelUrl?: string;
  delhivery?: { waybill: string; trackingUrl: string };
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
  const [trackInput, setTrackInput] = useState<string>('');

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [userFilterMode, setUserFilterMode] = useState<UserFilterMode>('all');

  // Tracking / logistics actions
  const [actionLoading, setActionLoading] = useState(false);
  const [syncingTracking, setSyncingTracking] = useState(false);

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
      const filterValue = statusFilter ? statusToApi[statusFilter as OrderStatus] : undefined;
      const { orders: fetchedOrders } = await orderService.getOrders(50, null, filterValue);

      const mappedOrders: Order[] = fetchedOrders.map((order: any) => ({
        ...order,
        userId: order.userId || '',
        orderType: order.orderType || 'standard',
        isCancelable: order.isCancelable ?? true,
        isReturnEligible: order.isReturnEligible ?? false,
        payment: order.payment || { paymentId: '', paymentMethod: '', paymentStatus: '', transactionRef: '' },
        track: order.track || '',
        waybill: order.waybill || order.delhivery?.waybill || '',
        trackingUrl: order.trackingUrl || order.delhivery?.trackingUrl || order.track || '',
        trackingEvents: Array.isArray(order.trackingEvents) ? order.trackingEvents : [],
        shipmentStatus: order.shipmentStatus || '',
        deliveryMode: order.deliveryMode || '',
        estimatedDelivery: order.estimatedDelivery || '',
        labelUrl: order.labelUrl || '',
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, order: Order) => {
    const confirmMsg = {
      confirmed: `Confirm order ${orderId.slice(0, 8)}? This will auto-generate a Delhivery waybill and notify the customer on WhatsApp.`,
      shipped:   `Mark order as SHIPPED? This will send a WhatsApp notification with tracking link.`,
      delivered: `Mark order as DELIVERED? This will send a WhatsApp review/feedback message.`,
      cancelled: `Cancel this order? This cannot be undone.`,
      pending:   null,
    }[newStatus];

    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      if (newStatus === 'confirmed') {
        const res = await logisticsService.generateWaybill(orderId);
        const waybill = (res as any).waybill || '';
        const trackingUrl = (res as any).trackingUrl || '';
        toast.success(`✅ Order confirmed! Waybill: ${waybill}`);
        if (waybill) {
          // Refresh selected order with new waybill info
          setSelectedOrder((prev) => prev ? { ...prev, waybill, trackingUrl, orderStatus: 'CONFIRMED' } : prev);
        }
      } else if (newStatus === 'shipped') {
        if (!order.waybill && !order.delhivery?.waybill) {
          toast.error('No waybill found. Confirm order first to generate a waybill.');
          setActionLoading(false);
          return;
        }
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/shipped`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        toast.success('📦 Order marked as SHIPPED — WhatsApp sent!');
        await orderService.updateOrderStatus(orderId, 'SHIPPED');
      } else if (newStatus === 'delivered') {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/delivered`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        toast.success('🎉 Order marked as DELIVERED — WhatsApp sent!');
        await orderService.updateOrderStatus(orderId, 'DELIVERED');
      } else {
        if (trackInput && trackInput !== (order.track || '')) {
          await orderService.updateOrderTrack(orderId, trackInput.trim());
        }
        const apiStatus = statusToApi[newStatus];
        await orderService.updateOrderStatus(orderId, apiStatus as any);
        toast.success(`Status updated to ${newStatus}`);
      }
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(`Action failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateWaybill = async (order: Order) => {
    if (!window.confirm(`Generate waybill for order ${order.orderId || order.id.slice(0, 8)}?`)) return;
    setActionLoading(true);
    try {
      const res = await logisticsService.generateWaybill(order.id);
      const waybill = (res as any).waybill || '';
      const trackingUrl = (res as any).trackingUrl || '';
      if (!waybill) throw new Error('No waybill returned from Delhivery');
      toast.success(`✅ Waybill generated: ${waybill}`);
      setSelectedOrder((prev) => prev ? { ...prev, waybill, trackingUrl } : prev);
      await fetchOrders();
    } catch (err: any) {
      toast.error(`Waybill failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncTracking = async (order: Order) => {
    const waybill = order.waybill || order.delhivery?.waybill;
    if (!waybill) {
      toast.error('No waybill found. Confirm order first.');
      return;
    }
    setSyncingTracking(true);
    try {
      const result = await logisticsService.syncTracking(order.id);
      const events: TrackingEvent[] = (result as any).events || [];
      const latestStatus = (result as any).latestStatus || '';
      setSelectedOrder((prev) => prev ? { ...prev, trackingEvents: events, shipmentStatus: latestStatus } : prev);
      toast.success(`Tracking synced — ${events.length} event(s) updated.`);
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setSyncingTracking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
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
        title={selectedOrder ? `Order #${selectedOrder.orderId || selectedOrder.id.slice(0, 8)}` : 'Order Details'}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">

            {/* ── STATUS & ACTIONS BAR ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                <StatusBadge status={String(selectedOrder.orderStatus).toLowerCase() as OrderStatus} />
              </div>
              <div className="flex flex-wrap gap-2 md:items-center">
                <div className="relative">
                  <select
                    value={String(selectedOrder.orderStatus).toLowerCase()}
                    disabled={actionLoading}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus, selectedOrder)}
                    className="admin-input appearance-none pr-10 text-sm"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
                {actionLoading && <span className="text-xs text-muted-foreground animate-pulse">Processing…</span>}
                <button type="button" onClick={() => handleDownloadInvoice(selectedOrder)} className="admin-btn-outline text-sm whitespace-nowrap">
                  Download Invoice
                </button>
              </div>
            </div>

            {/* ── DELIVERY INFO & TRACKING ── */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Truck className="w-4 h-4 text-primary" />
                  Delivery & Tracking
                </div>
                <button
                  onClick={() => handleSyncTracking(selectedOrder)}
                  disabled={syncingTracking}
                  className="flex items-center gap-1.5 text-xs admin-btn-ghost px-3 py-1.5 rounded-lg"
                  title="Fetch latest tracking events from Delhivery"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingTracking ? 'animate-spin' : ''}`} />
                  {syncingTracking ? 'Syncing…' : 'Sync Tracking'}
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Delivery mode + estimated date row */}
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.deliveryMode && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedOrder.deliveryMode.toLowerCase().includes('express')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Truck className="w-3 h-3" />
                      {selectedOrder.deliveryMode}
                    </span>
                  )}
                  {selectedOrder.estimatedDelivery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Est. {selectedOrder.estimatedDelivery}
                    </span>
                  )}
                  {selectedOrder.shipmentStatus && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedOrder.shipmentStatus}
                    </span>
                  )}
                </div>

                {/* Waybill row */}
                {selectedOrder.waybill ? (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Delhivery Waybill</p>
                      <p className="font-mono font-semibold text-sm mt-0.5">{selectedOrder.waybill}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(selectedOrder.waybill!, 'Waybill')} className="admin-btn-ghost p-2 rounded-lg" title="Copy waybill">
                        <Copy className="w-4 h-4" />
                      </button>
                      {selectedOrder.trackingUrl && (
                        <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-ghost p-2 rounded-lg" title="View live tracking">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>No waybill yet for this order.</span>
                    </div>
                    <button
                      onClick={() => handleGenerateWaybill(selectedOrder)}
                      disabled={actionLoading}
                      className="self-start flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {actionLoading ? 'Generating…' : 'Generate Waybill Now'}
                    </button>
                  </div>
                )}

                {/* Tracking Events Timeline */}
                {selectedOrder.trackingEvents && selectedOrder.trackingEvents.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Live Tracking Events</p>
                    <div className="relative pl-4 border-l-2 border-primary/30 space-y-3">
                      {selectedOrder.trackingEvents.slice().reverse().map((ev, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[1.15rem] top-1 w-3 h-3 rounded-full bg-primary/80 border-2 border-background" />
                          <div className="bg-muted/30 rounded-lg px-3 py-2">
                            <p className="font-medium text-sm">{ev.status}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {ev.location && <span>📍 {ev.location}</span>}
                              {ev.timestamp && (
                                <span>{new Date(ev.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-1">No tracking events yet. Click "Sync Tracking" after the shipment is picked up.</p>
                )}
              </div>
            </div>

            {/* ── CUSTOMER INFO ── */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Customer</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{selectedOrder.deliveryAddress.firstName} {selectedOrder.deliveryAddress.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{selectedOrder.deliveryAddress.phone}</p>
                </div>
              </div>
            </div>

            {/* ── SHIPPING ADDRESS ── */}
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Shipping Address</h3>
              <div className="text-sm leading-relaxed bg-muted/20 rounded-lg p-3 space-y-0.5">
                <p>{selectedOrder.deliveryAddress.addressLine1}</p>
                {selectedOrder.deliveryAddress.addressLine2 && <p>{selectedOrder.deliveryAddress.addressLine2}</p>}
                <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.region} – {selectedOrder.deliveryAddress.zip}</p>
                <p className="text-muted-foreground">{selectedOrder.deliveryAddress.country}</p>
              </div>
            </div>

            {/* ── ORDER ITEMS ── */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Items ({selectedOrder.items.length})</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.productName} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PRICING ── */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Pricing</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{selectedOrder.pricing.subTotal?.toLocaleString()}</span></div>
                {selectedOrder.pricing.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>Tax (GST)</span><span>₹{selectedOrder.pricing.tax?.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between"><span>Shipping</span><span>₹{selectedOrder.pricing.shippingCharge?.toLocaleString()}</span></div>
                {selectedOrder.pricing.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount {selectedOrder.pricing.couponCode ? `(${selectedOrder.pricing.couponCode})` : ''}</span>
                    <span>−₹{selectedOrder.pricing.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-border text-base">
                  <span>Grand Total</span><span>₹{selectedOrder.pricing.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── PAYMENT ── */}
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="font-medium text-sm">{selectedOrder.payment.paymentMethod || '—'}</p>
                {selectedOrder.payment.transactionRef && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Ref: {selectedOrder.payment.transactionRef}</p>
                )}
              </div>
              <StatusBadge status={String(selectedOrder.payment.paymentStatus).toLowerCase() as OrderStatus} />
            </div>

            {/* ── ORDER TIMELINE ── */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Order Timeline</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Ordered', ts: selectedOrder.timestamps.orderedAt },
                  { label: 'Confirmed', ts: selectedOrder.timestamps.confirmedAt },
                  { label: 'Shipped', ts: selectedOrder.timestamps.shippedAt },
                  { label: 'Delivered', ts: selectedOrder.timestamps.deliveredAt },
                ].map(({ label, ts }) =>
                  ts ? (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{formatTimestamp(ts)}</span>
                    </div>
                  ) : null
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
