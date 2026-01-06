/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Search, Eye, ChevronDown } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { orderService } from '../../services/orderService';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof statusOptions[number];

interface OrderItem {
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
  confirmedAt: { seconds: number; nanoseconds: number };
  deliveredAt: { seconds: number; nanoseconds: number };
  orderedAt: { seconds: number; nanoseconds: number };
  shippedAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

interface Order {
  id: string;
  userId: string;
  orderId: string;
  orderStatus: OrderStatus;
  orderType: string;
  isCancelable: boolean;
  isReturnEligible: boolean;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  payment: Payment;
  pricing: Pricing;
  timestamps: Timestamps;
  createdAt: string;
  updatedAt: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { orders: fetchedOrders } = await orderService.getOrders(
        50,
        null,
        statusFilter || undefined
      );
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order =>
    `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number }) => {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toLocaleDateString();
  };

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: Order) => (
        <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order: Order) => (
        <div>
          <p className="font-medium">
            {order.deliveryAddress.firstName} {order.deliveryAddress.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{order.deliveryAddress.phone}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: Order) => (
        <span>{order.items.length} item(s)</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (order: Order) => (
        <span className="font-medium">₹{order.pricing.grandTotal.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => <StatusBadge status={order.orderStatus} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order: Order) => <StatusBadge status={order.payment.paymentStatus as OrderStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
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
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="admin-input appearance-none pr-10 min-w-[160px]"
          >
            <option value="">All Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
        emptyMessage="No orders found"
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id.slice(0, 8)}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status Update */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <StatusBadge status={selectedOrder.orderStatus} />
              </div>
              <div className="relative">
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  className="admin-input appearance-none pr-10"
                >
                  {statusOptions.map(orderStatus => (
                    <option key={orderStatus} value={orderStatus}>
                      {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryAddress.firstName} {selectedOrder.deliveryAddress.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedOrder.deliveryAddress.phone}</p>
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
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.region} {selectedOrder.deliveryAddress.zip}
                </p>
                <p>{selectedOrder.deliveryAddress.country}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
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
                  <span>₹{selectedOrder.pricing.subTotal.toLocaleString()}</span>
                </div>
                {selectedOrder.pricing.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount ({selectedOrder.pricing.couponCode})</span>
                    <span>-₹{selectedOrder.pricing.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{selectedOrder.pricing.shippingCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{selectedOrder.pricing.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block">Payment Method</span>
                <span className="font-medium">{selectedOrder.payment.paymentMethod}</span>
              </div>
              <StatusBadge status={selectedOrder.payment.paymentStatus as OrderStatus} />
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-3">Order Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ordered</span>
                  <span>{formatTimestamp(selectedOrder.timestamps.orderedAt)}</span>
                </div>
                {selectedOrder.timestamps.confirmedAt && (
                  <div className="flex justify-between">
                    <span>Confirmed</span>
                    <span>{formatTimestamp(selectedOrder.timestamps.confirmedAt)}</span>
                  </div>
                )}
                {selectedOrder.timestamps.shippedAt && (
                  <div className="flex justify-between">
                    <span>Shipped</span>
                    <span>{formatTimestamp(selectedOrder.timestamps.shippedAt)}</span>
                  </div>
                )}
                {selectedOrder.timestamps.deliveredAt && (
                  <div className="flex justify-between">
                    <span>Delivered</span>
                    <span>{formatTimestamp(selectedOrder.timestamps.deliveredAt)}</span>
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
