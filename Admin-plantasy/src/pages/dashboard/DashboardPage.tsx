/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Ticket,
  Clock,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusBadge, { BadgeVariant } from "../../components/common/StatusBadge";
import { Order, DashboardStats } from "../../types";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import { couponService } from "../../services/couponService";

import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

type TimeRange = "total" | "30d" | "7d" | "24h";

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

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allSuccessfulPayments, setAllSuccessfulPayments] = useState<
    { amount: number; createdAt?: Date | null }[]
  >([]);

  const [range, setRange] = useState<TimeRange>("total");

  const getRangeStart = (r: TimeRange): Date | null => {
    const now = new Date();
    switch (r) {
      case "30d": {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }
      case "7d": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d;
      }
      case "24h": {
        const d = new Date(now);
        d.setHours(d.getHours() - 24);
        return d;
      }
      case "total":
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          recent,
          productsCount,
          activeCouponsCount,
          pendingCount,
          lowStock,
        ] = await Promise.all([
          orderService.getRecentOrders(5),
          productService.getProductsCount(),
          couponService.getActiveCouponsCount(),
          orderService.getPendingOrdersCount(),
          productService.getLowStockProducts(),
        ]);

        setRecentOrders(recent);
        setStats((prev) => ({
          ...prev,
          totalProducts: productsCount,
          activeCoupons: activeCouponsCount,
          pendingOrders: pendingCount,
          lowStockProducts: lowStock.length,
        }));

        // Load all orders
        const ordersSnap = await getDocs(collection(db, "orders"));
        const orders: Order[] = ordersSnap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            ...data,
          } as Order;
        });
        setAllOrders(orders);

        // Load successful payments from payments collection
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(
          paymentsRef,
          where("status", "==", "SUCCESS")
        );
        const paymentsSnap = await getDocs(paymentsQuery);

        const payments = paymentsSnap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const ts = data.createdAt as Timestamp | undefined;
          return {
            amount: Number(data.amount || 0),
            createdAt: ts ? ts.toDate() : null,
          };
        });

        setAllSuccessfulPayments(payments);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  // Derived stats for selected range
  const { rangedOrdersCount, rangedRevenue } = useMemo(() => {
    const start = getRangeStart(range);

    // Use timestamps.orderedAt for order counting
    const filteredOrders = start
      ? allOrders.filter((o: any) => {
          const ts: Timestamp | undefined =
            o.timestamps?.orderedAt ?? undefined;
          if (!ts) return false;
          const d = ts.toDate();
          return d >= start;
        })
      : allOrders;

    const filteredPayments = start
      ? allSuccessfulPayments.filter((p) => {
          if (!p.createdAt) return false;
          return p.createdAt >= start;
        })
      : allSuccessfulPayments;

    const ordersCount = filteredOrders.length;
    const revenue = filteredPayments.reduce(
      (sum, p) => sum + (isFinite(p.amount) ? p.amount : 0),
      0
    );

    return {
      rangedOrdersCount: ordersCount,
      rangedRevenue: revenue,
    };
  }, [allOrders, allSuccessfulPayments, range]);

  // Global totals
  useEffect(() => {
    const totalOrders = allOrders.length;
    const totalRevenue = allSuccessfulPayments.reduce(
      (s, p) => s + (isFinite(p.amount) ? p.amount : 0),
      0
    );
    setStats((prev) => ({
      ...prev,
      totalOrders,
      totalRevenue,
    }));
  }, [allOrders, allSuccessfulPayments]);

  const orderColumns = [
    {
      key: "id",
      header: "Order ID",
      render: (order: Order) => (
        <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order: Order) => (
        <div>
          <p className="font-medium">
            {order.deliveryAddress.firstName}{" "}
            {order.deliveryAddress.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.deliveryAddress.phone}
          </p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (order: Order) => (
        <span className="font-medium">
          ₹{order.pricing.grandTotal.toFixed(2)}
        </span>
      ),
    },
   {
  key: "status",
  header: "Status",
  render: (order: Order) => {
    // Prefer order.orderStatus, fallback to order.status, and normalize to lowercase
    const rawStatus =
      (order as any).orderStatus ??
      (order as any).status ??
      "unknown";

    const normalizedStatus = String(rawStatus).toLowerCase() as BadgeVariant;

    return <StatusBadge status={normalizedStatus} />;
  },
},

    {
      key: "createdAt",
      header: "Date",
      render: (order: Order) => (
        <span className="text-muted-foreground">
          {order.createdAt
            ? new Date(order.createdAt as any).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const rangeLabel = (r: TimeRange) => {
    switch (r) {
      case "total":
        return "Total";
      case "30d":
        return "Last 30 days";
      case "7d":
        return "Last 7 days";
      case "24h":
        return "Last 24 hours";
      default:
        return "Total";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
            Welcome back! Here&apos;s your store overview.
          </p>
        </div>
      </div>

      {/* Range selector for orders & revenue */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">
          Orders &amp; revenue range:
        </span>
        <div className="inline-flex rounded-md border bg-background p-1 text-xs">
          {(["total", "30d", "7d", "24h"] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {rangeLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={`Total Orders (${rangeLabel(range)})`}
          value={rangedOrdersCount}
          icon={<ShoppingCart className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        <StatCard
          title={`Total Revenue (${rangeLabel(range)})`}
          value={formatCurrency(rangedRevenue)}
          icon={<DollarSign className="h-6 w-6 text-success" />}
          iconBgClass="bg-success/10"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6 text-accent" />}
          iconBgClass="bg-accent/20"
        />
        <StatCard
          title="Active Coupons"
          value={stats.activeCoupons}
          icon={<Ticket className="h-6 w-6 text-warning" />}
          iconBgClass="bg-warning/10"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="admin-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Orders</p>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
        </div>

        <div className="admin-card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Low Stock Products
            </p>
            <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <a
            href="/orders"
            className="text-sm text-primary hover:underline"
          >
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
