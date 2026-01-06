import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Package, Ticket, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Order, DashboardStats } from '../../types';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { couponService } from '../../services/couponService';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeCoupons: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          recent,
          ordersCount,
          revenue,
          productsCount,
          activeCouponsCount,
          pendingCount,
          lowStock,
        ] = await Promise.all([
          orderService.getRecentOrders(5),
          orderService.getOrdersCount(),
          orderService.getLast30DaysRevenue(),
          productService.getProductsCount(),
          couponService.getActiveCouponsCount(),
          orderService.getPendingOrdersCount(),
          // IMPORTANT: implement this inside productService so it only returns products where stock < 5
          productService.getLowStockProducts(),
        ]);

        //console.log('Low stock products:', lowStock);
        setStats({
          totalOrders: ordersCount,
          totalRevenue: revenue,
          totalProducts: productsCount,
          activeCoupons: activeCouponsCount,
          pendingOrders: pendingCount,
          lowStockProducts: lowStock.length,
        });
        setRecentOrders(recent);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const orderColumns = [
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
          <p className="text-xs text-muted-foreground">
            {order.deliveryAddress.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (order: Order) => (
        <span className="font-medium">
          ₹{order.pricing.grandTotal.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
        render: (order: Order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (order: Order) => (
        <span className="text-muted-foreground">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back! Here's your store overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-6 h-6 text-primary" />}
          trend={{ value: 12.5, isPositive: true }}
          iconBgClass="bg-primary/10"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-success" />}
          trend={{ value: 8.2, isPositive: true }}
          iconBgClass="bg-success/10"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6 text-accent" />}
          iconBgClass="bg-accent/20"
        />
        <StatCard
          title="Active Coupons"
          value={stats.activeCoupons}
          icon={<Ticket className="w-6 h-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="admin-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
        </div>

        <div className="admin-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Low Stock Products</p>
            <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <a href="/orders" className="text-sm text-primary hover:underline">
            View All
          </a>
        </div>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          emptyMessage="No recent orders"
        />
      </div>
    </div>
  );
};

export default DashboardPage;
