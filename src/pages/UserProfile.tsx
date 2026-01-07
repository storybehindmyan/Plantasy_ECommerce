/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import {
  MoreHorizontal,
  Edit3,
  Camera,
  AlignLeft,
  Video,
  Smile,
  Lock,
  ChevronDown,
  Package,
  Wallet,
  Heart,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { db, storage } from "../firebase/firebaseConfig";
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


// --- Shared Components ---

// Plantasy Logo for empty states
const PlantasyLogo = () => (
  <div className="flex flex-col items-center mt-12 opacity-80">
    <div className="w-12 h-16 border-2 border-white/80 rounded-full flex items-center justify-center mb-1 drop-shadow-md bg-transparent">
      <span className="font-serif text-2xl italic text-white pt-1">P</span>
    </div>
    <span className="text-xl font-serif font-semibold tracking-tight text-white drop-shadow-md mt-1">
      Plantasy
    </span>
  </div>
);

// --- Header & Nav ---

const ProfileHeader = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      const imageRef = ref(storage, `users/${user.uid}/image.jpg`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
      });

      updateUser({ photoURL: downloadURL });
    } catch (err) {
      console.error("Error uploading profile image:", err);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) return null;

  return (
    <div className="bg-[#c16e41] h-48 relative flex items-center px-10">
      {/* Top Corners */}
      <div className="absolute top-4 left-4 text-white">
        <Camera
          className="w-5 h-5 opacity-80 cursor-pointer hover:opacity-100"
          onClick={triggerFileInput}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>
      {/* <div className="absolute top-4 right-4 text-white">
        <MoreHorizontal className="w-6 h-6 cursor-pointer" />
      </div> */}

      {/* Main Profile Info */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-black/20 overflow-hidden border-2 border-white/30 backdrop-blur-sm flex items-center justify-center relative group">
          <img
            src={
              user.photoURL ||
              "https://tse1.mm.bing.net/th/id/OIP.nloKH2rnGKa0cl6U5alOygAAAA?pid=ImgDet&w=185&h=277&c=7&dpr=1.3&o=7&rm=3"
            }
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={triggerFileInput}
          >
            <Camera className="text-white w-6 h-6" />
          </div>
        </div>
        <div className="text-white">
          <h1 className="text-3xl font-serif mb-1">{user.name}</h1>
          <div className="flex gap-4 text-sm font-light opacity-90">
            <span>+91 {user.phone}</span>

          </div>
        </div>
      </div>
    </div>
  );
};

const NavTab = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    end={to === "/profile"}
    className={({ isActive }) =>
      `px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${isActive ? "text-white" : "text-gray-400 hover:text-[#c16e41]"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {label}
        {isActive && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c16e41]" />
        )}
      </>
    )}
  </NavLink>
);

// --- Sections ---

const ProfileInfo = () => {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = React.useState(user?.bio || "");

  React.useEffect(() => {
    if (user?.bio !== undefined) setBio(user.bio || "");
  }, [user?.bio]);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBio = e.target.value;
    setBio(newBio);
  };

  const saveBio = async () => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        bio,
        updatedAt: serverTimestamp(),
      });
      updateUser({ bio });
      alert("Bio updated!");
    } catch (err) {
      console.error("Error updating bio:", err);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-serif text-white">Profile</h2>
        <button className="flex items-center gap-2 text-[#c16e41] text-sm hover:text-[#a05a32] transition-colors">
          <Edit3 size={14} /> Edit Profile
        </button>
      </div>

      <p className="text-white/60 text-sm mb-12">Join date: Dec 28, 2025</p>

      <div className="mb-8">
        <h3 className="text-white text-lg font-serif mb-6">About</h3>
        <div className="w-full bg-transparent border border-white/10 rounded-sm focus-within:border-white/30 transition-colors">
          <textarea
            value={bio}
            onChange={handleBioChange}
            onBlur={saveBio}
            placeholder="Add a short bio or personal note..."
            className="w-full bg-transparent p-4 text-white text-sm focus:outline-none min-h-[120px] resize-none placeholder:text-white/30"
          />
          <div className="flex gap-4 p-4 text-white/50 border-t border-white/5">
            <Camera
              size={18}
              className="cursor-pointer hover:text-white transition-colors"
            />
            <AlignLeft
              size={18}
              className="cursor-pointer hover:text-white transition-colors"
            />
            <Video
              size={18}
              className="cursor-pointer hover:text-white transition-colors"
            />
            <span className="text-xs font-bold self-center cursor-pointer hover:text-white transition-colors tracking-widest">
              GIF
            </span>
            <Smile
              size={18}
              className="cursor-pointer hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Types matching your sample document
type OrderAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  zip: string;
};

type OrderItem = {
  price: number;
  productId: string;
  productImage: string;
  productName: string;
  quantity: number;
  totalPrice: number;
};

type OrderPayment = {
  paymentId: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string;
};

type OrderPricing = {
  couponCode?: string;
  discount: number;
  grandTotal: number;
  shippingCharge: number;
  subTotal: number;
  tax: number;
};

type OrderTimestamps = {
  confirmedAt?: Timestamp;
  deliveredAt?: Timestamp;
  orderedAt?: Timestamp;
  shippedAt?: Timestamp;
  updatedAt?: Timestamp;
};

type OrderDoc = {
  id: string; // orderId/docId
  userId: string;
  createdAt?: Timestamp;
  deliveryAddress: OrderAddress;
  invoiceId?: string;
  isCancelable: boolean;
  isReturnEligible: boolean;
  items: OrderItem[];
  orderId: string;
  orderStatus?: string | null;
  orderType?: string;
  payment?: OrderPayment;
  pricing?: OrderPricing;
  timestamps?: OrderTimestamps;
  track?: string;
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<OrderDoc[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openOrderId, setOpenOrderId] = React.useState<string | null>(null);

  const fetchOrders = React.useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      // 1. Get the orders array (orderIds) from users/{uid}
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? (userSnap.data() as any) : null;
      const orderIds: string[] = userData?.orders || [];

      if (!orderIds.length) {
        setOrders([]);
        return;
      }

      // 2. For each orderId, fetch orders/{orderId}
      const ordersCol = collection(db, "orders");
      const orderDocs: OrderDoc[] = [];

      // In Firestore you cannot query by `in` and order by other field easily for many ids,
      // so fetch by id one by one here.
      for (const oid of orderIds) {
        const oRef = doc(ordersCol, oid);
        const oSnap = await getDoc(oRef);
        if (oSnap.exists()) {
          const data = oSnap.data() as any;
          orderDocs.push({
            id: oSnap.id,
            userId: data.userId,
            createdAt: data.createdAt,
            deliveryAddress: data.deliveryAddress,
            invoiceId: data.invoiceId,
            isCancelable: data.isCancelable,
            isReturnEligible: data.isReturnEligible,
            items: data.items || [],
            orderId: data.orderId,
            orderStatus: data.orderStatus ?? null,
            orderType: data.orderType,
            payment: data.payment,
            pricing: data.pricing,
            timestamps: data.timestamps,
            track: data.track,
          });
        }
      }

      // 3. Sort by createdAt descending (latest first)
      orderDocs.sort((a, b) => {
        const ta = a.createdAt?.toMillis() ?? 0;
        const tb = b.createdAt?.toMillis() ?? 0;
        return tb - ta;
      });

      setOrders(orderDocs);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const toggleOrder = (id: string) => {
    setOpenOrderId((prev) => (prev === id ? null : id));
  };

  const formatTs = (ts?: Timestamp) =>
    ts ? ts.toDate().toLocaleString() : "N/A";

  const handleGenerateInvoice = (order: OrderDoc) => {
    // If you have an invoice PDF URL stored somewhere, open it here.
    // For now, just alert with invoiceId to show it's wired.
    if (order.invoiceId) {
      alert(`Generate invoice for ${order.invoiceId}`);
    } else {
      alert("Invoice ID not available for this order.");
    }
  };

  if (!user?.uid) {
    return (
      <div>
        <h2 className="text-2xl font-serif text-white mb-6">My Orders</h2>
        <div className="border border-white/10 p-8 text-center rounded-sm">
          <p className="text-gray-400">Please log in to view your orders.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-serif text-white mb-6">My Orders</h2>
        <div className="border border-white/10 p-8 text-center rounded-sm">
          <p className="text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div>
        <h2 className="text-2xl font-serif text-white mb-6">My Orders</h2>
        <div className="border border-white/10 p-8 text-center rounded-sm">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">You haven't placed any orders yet.</p>
          <button className="mt-4 text-[#c16e41] hover:underline">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif text-white mb-6">My Orders</h2>
      <div className="space-y-4">
        {orders.map((order) => {
          const isOpen = openOrderId === order.id;
          const status = order.orderStatus || "N/A";

          return (
            <div
              key={order.id}
              className="border border-white/10 rounded-sm bg-white/5 overflow-hidden"
            >
              {/* Card header */}
              <button
                onClick={() => toggleOrder(order.id)}
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="text-[#c16e41]" size={22} />
                  <div>
                    <p className="text-white text-sm font-medium">
                      Order #{order.orderId || order.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      Placed on {formatTs(order.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.deliveryAddress.firstName}{" "}
                      {order.deliveryAddress.lastName} •{" "}
                      {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.region}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status badge */}
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${status === "delivered"
                        ? "border-emerald-500 text-emerald-400"
                        : status === "confirmed"
                          ? "border-blue-500 text-blue-400"
                          : status === "cancelled"
                            ? "border-red-500 text-red-400"
                            : "border-gray-500 text-gray-300"
                      }`}
                  >
                    {status.toUpperCase()}
                  </span>
                  {/* Total */}
                  <span className="text-sm text-white font-medium">
                    ₹{order.pricing?.grandTotal ?? order.items?.[0]?.totalPrice}
                  </span>
                  <ChevronDown
                    className={`text-white transition-transform ${isOpen ? "rotate-180" : ""
                      }`}
                    size={18}
                  />
                </div>
              </button>

              {/* Card body (accordion) */}
              {isOpen && (
                <div className="px-4 pb-4 pt-3 text-sm text-white/80 space-y-4 border-t border-white/10">
                  {/* Items */}
                  <div>
                    <p className="font-semibold mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${item.productId}-${idx}`}
                          className="flex justify-between items-center text-xs md:text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-10 h-10 rounded object-cover border border-white/10"
                              />
                            )}
                            <div>
                              <p className="text-white">
                                {item.productName || item.productId}
                              </p>
                              <p className="text-gray-400">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <p className="text-white">
                            ₹{item.totalPrice ?? item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2">Pricing</p>
                      <div className="text-xs space-y-1 text-gray-300">
                        <p>
                          Subtotal: ₹{order.pricing?.subTotal ?? "N/A"}
                        </p>
                        <p>
                          Discount: -₹{order.pricing?.discount ?? 0}{" "}
                          {order.pricing?.couponCode
                            ? `(${order.pricing.couponCode})`
                            : ""}
                        </p>
                        <p>
                          Shipping: ₹{order.pricing?.shippingCharge ?? 0}
                        </p>
                        <p>Tax: ₹{order.pricing?.tax ?? 0}</p>
                        <p className="text-white font-medium pt-1">
                          Grand Total: ₹{order.pricing?.grandTotal ?? "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Payment & tracking */}
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold mb-2">Payment</p>
                        <div className="text-xs space-y-1 text-gray-300">
                          <p>
                            Method: {order.payment?.paymentMethod || "N/A"}
                          </p>
                          <p>
                            Status: {order.payment?.paymentStatus || "N/A"}
                          </p>
                          <p>
                            Payment ID: {order.payment?.paymentId || "N/A"}
                          </p>
                          <p>
                            Transaction Ref:{" "}
                            {order.payment?.transactionRef || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold mb-1">Tracking</p>
                        {order.track ? (
                          <a
                            href={order.track}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#c16e41] hover:underline text-xs md:text-sm"
                          >
                            Here is your tracking link
                            <ChevronRight size={14} />
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400">
                            Tracking link not available.
                          </p>
                        )}
                      </div>

                      <div>
                        <button
                          onClick={() => handleGenerateInvoice(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm border border-white/20 text-white rounded-sm hover:bg-white/10 transition-colors"
                        >
                          Generate Invoice
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="font-semibold mb-2">Timeline</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 text-xs text-gray-300 gap-1">
                      <p>Ordered at: {formatTs(order.timestamps?.orderedAt)}</p>
                      <p>
                        Confirmed at: {formatTs(order.timestamps?.confirmedAt)}
                      </p>
                      <p>Shipped at: {formatTs(order.timestamps?.shippedAt)}</p>
                      <p>
                        Delivered at: {formatTs(order.timestamps?.deliveredAt)}
                      </p>
                      <p>Updated at: {formatTs(order.timestamps?.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div>
                    <p className="font-semibold mb-2">Delivery Address</p>
                    <p className="text-xs text-gray-300">
                      {order.deliveryAddress.firstName}{" "}
                      {order.deliveryAddress.lastName}
                      <br />
                      {order.deliveryAddress.addressLine1}
                      {order.deliveryAddress.addressLine2 && (
                        <>
                          <br />
                          {order.deliveryAddress.addressLine2}
                        </>
                      )}
                      <br />
                      {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.region}{" "}
                      {order.deliveryAddress.zip}
                      <br />
                      {order.deliveryAddress.country}
                      <br />
                      {order.deliveryAddress.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


const WalletPage = () => (
  <div>
    <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
      <Wallet className="text-[#c16e41]" /> My Wallet
    </h2>
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-8 rounded-lg border border-white/5">
      <p className="text-gray-400 text-sm mb-1">Total Balance</p>
      <h3 className="text-4xl text-white font-medium mb-6">₹0.00</h3>
      <div className="flex gap-4">
        <button className="bg-[#c16e41] text-white px-6 py-2 rounded-sm text-sm font-medium">
          Add Money
        </button>
        <button className="border border-white/20 text-white px-6 py-2 rounded-sm text-sm font-medium">
          History
        </button>
      </div>
    </div>
  </div>
);

// Address type matching Firestore doc
type AddressDoc = {
  id: string;
  Country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  zip: string;
  isDefault: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const COUNTRY_OPTIONS = ["India"];
const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

const Addresses = () => {
  const { user, updateUser } = useAuth();
  const [isAddingMode, setIsAddingMode] = React.useState(false);
  const [addresses, setAddresses] = React.useState<AddressDoc[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openMenuForId, setOpenMenuForId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    Country: "India",
    zip: "",
    isDefault: false,
  });

  const uid = user?.uid;

  const loadAddresses = React.useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const addrCol = collection(db, "users", uid, "addresses");
      const snap = await getDocs(addrCol);
      const list: AddressDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          Country: data.Country,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          region: data.region,
          zip: data.zip,
          isDefault: !!data.isDefault,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setAddresses(list);
    } catch (err) {
      console.error("Error loading addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  React.useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const generateAddressId = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `ADD00${random}`;
  };

  const handleSave = async () => {
    if (!uid) return;
    try {
      const addrCol = collection(db, "users", uid, "addresses");

      if (form.isDefault) {
        const qDefault = query(addrCol, where("isDefault", "==", true));
        const snapDefault = await getDocs(qDefault);
        for (const d of snapDefault.docs) {
          await updateDoc(d.ref, {
            isDefault: false,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const newId = generateAddressId();
      const addrRef = doc(addrCol, newId);

      await updateDoc(addrRef, {}).catch(async () => {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(addrRef, {});
      });

      await updateDoc(addrRef, {
        Country: form.Country,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone, // stored without +91
        region: form.region,
        zip: form.zip,
        isDefault: form.isDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (form.isDefault) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          address: newId,
          updatedAt: serverTimestamp(),
        });
        updateUser({ address: newId } as any);
      }

      setIsAddingMode(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        region: "",
        Country: "India",
        zip: "",
        isDefault: false,
      });
      await loadAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
    }
  };

  const handleSetDefault = async (addr: AddressDoc) => {
    if (!uid || addr.isDefault) return;
    try {
      const addrCol = collection(db, "users", uid, "addresses");
      const qDefault = query(addrCol, where("isDefault", "==", true));
      const snapDefault = await getDocs(qDefault);
      for (const d of snapDefault.docs) {
        await updateDoc(d.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }

      const addrRef = doc(addrCol, addr.id);
      await updateDoc(addrRef, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        address: addr.id,
        updatedAt: serverTimestamp(),
      });
      updateUser({ address: addr.id } as any);

      setOpenMenuForId(null);
      await loadAddresses();
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const handleDeleteAddress = async (addr: AddressDoc) => {
    if (!uid) return;
    try {
      const addrRef = doc(db, "users", uid, "addresses", addr.id);
      await deleteDoc(addrRef);
      // if the deleted address was default, clear user.address
      if (addr.isDefault) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          address: "",
          updatedAt: serverTimestamp(),
        });
        updateUser({ address: "" } as any);
      }
      setOpenMenuForId(null);
      await loadAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  return (
    <div className="min-h-[400px] flex flex-col">
      <h2 className="text-2xl font-serif text-white mb-2">My Addresses</h2>
      <p className="text-gray-400 text-sm mb-12">
        Add and manage the addresses you use often.
      </p>

      {isAddingMode ? (
        <div className="max-w-md bg-white/5 p-8 rounded-lg border border-white/10">
          <h3 className="text-white text-lg font-serif mb-6">New Address</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                placeholder="First Name"
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              <input
                placeholder="Last Name"
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            {/* Phone with +91 prefix */}
            <div className="flex gap-2 items-center">
              <span className="px-3 py-2 rounded-sm bg-white/10 text-white text-sm border border-white/20">
                +91
              </span>
              <input
                placeholder="Phone number"
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/^\+?91/, ""),
                  })
                }
              />
            </div>
            <input
              placeholder="Address Line 1"
              className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
              value={form.addressLine1}
              onChange={(e) =>
                setForm({ ...form, addressLine1: e.target.value })
              }
            />
            <input
              placeholder="Address Line 2"
              className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
              value={form.addressLine2}
              onChange={(e) =>
                setForm({ ...form, addressLine2: e.target.value })
              }
            />
            <div className="flex gap-4">
              <input
                placeholder="City"
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
              {/* Region / State dropdown */}
              <select

                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm text-sm max-h-40 overflow-y-auto"
                value={form.region}
                onChange={(e) =>
                  setForm({ ...form, region: e.target.value })
                }
              >
                <option value="" className="bg-black">
                  Select State
                </option>
                {STATE_OPTIONS.map((s) => (
                  <option
                    key={s}
                    value={s}
                    className="bg-[#050505] text-white"
                  >
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              {/* Country dropdown */}
              <select
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm text-sm"
                value={form.Country}
                onChange={(e) =>
                  setForm({ ...form, Country: e.target.value })
                }
              >
                <option value="" className="bg-black">
                  Select Country
                </option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option
                    key={c}
                    value={c}
                    className="bg-[#050505] text-white"
                  >
                    {c}
                  </option>
                ))}
              </select>
              <input
                placeholder="Zip Code"
                className="w-full bg-transparent border border-white/20 p-3 text-white rounded-sm"
                value={form.zip}
                onChange={(e) =>
                  setForm({ ...form, zip: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="defaultAddress"
                type="checkbox"
                className="w-4 h-4 rounded border-white/40"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
              />
              <label
                htmlFor="defaultAddress"
                className="text-sm text-white/80 cursor-pointer"
              >
                Set as default address
              </label>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  handleSave();
                  alert("Address saved!");
                }}
                className="bg-[#c16e41] text-white px-6 py-2 rounded-sm text-sm hover:bg-[#a05a32]"
              >
                Save Address
              </button>
              <button
                onClick={() => setIsAddingMode(false)}
                className="text-white/60 px-6 py-2 text-sm hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center mb-12">
          {loading ? (
            <p className="text-gray-400">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <>
              <p className="text-white text-lg font-light mb-8">
                You haven't saved any addresses yet.
              </p>
              <button
                onClick={() => setIsAddingMode(true)}
                className="bg-[#c16e41] text-white px-8 py-3 rounded-sm text-sm font-medium hover:bg-[#a05a32] transition-colors"
              >
                Add New Address
              </button>
              <PlantasyLogo />
            </>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-6 border border-white/10 rounded-sm bg-white/5 relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded uppercase tracking-wider ${addr.isDefault
                          ? "bg-emerald-500 text-white"
                          : "bg-[#c16e41]/20 text-[#c16e41]"
                        }`}
                    >
                      {addr.isDefault ? "Default" : addr.firstName || "Address"}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuForId(
                            openMenuForId === addr.id ? null : addr.id
                          )
                        }
                      >
                        <MoreHorizontal
                          className="text-white/60 cursor-pointer hover:text-white"
                          size={18}
                        />
                      </button>
                      {openMenuForId === addr.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-[#111111] border border-white/10 rounded-sm shadow-lg z-20">
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10"
                            onClick={() => handleSetDefault(addr)}
                          >
                            Set as Default
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-white/10"
                            onClick={() => handleDeleteAddress(addr)}
                          >
                            Delete Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-white font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="text-white/60 text-sm">
                    +91 {addr.phone || ""}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {addr.addressLine1}
                  </p>
                  {addr.addressLine2 && (
                    <p className="text-white/80 text-sm">{addr.addressLine2}</p>
                  )}
                  <p className="text-white/60 text-sm">
                    {addr.city}, {addr.region}, {addr.zip}
                  </p>
                  <p className="text-white/60 text-xs mt-1">{addr.Country}</p>
                </div>
              ))}
              <button
                onClick={() => setIsAddingMode(true)}
                className="border border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center min-h-[140px] text-white/40 hover:text-white hover:border-white/40 transition-all"
              >
                <Plus size={24} className="mb-2" />
                <span>Add Another Address</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Subscriptions = () => (
  <div className="min-h-[400px] flex flex-col">
    <h2 className="text-2xl font-serif text-white mb-2">Subscriptions</h2>
    <p className="text-gray-400 text-sm mb-12">
      View and manage the subscriptions you've purchased.
    </p>

    <div className="flex-1 flex flex-col items-center justify-center mb-12">
      <p className="text-white text-lg font-medium mb-2">
        No purchased subscriptions
      </p>
      <p className="text-gray-400 text-sm mb-8">
        When you purchase a subscription, it'll appear here.
      </p>
      <PlantasyLogo />
    </div>
  </div>
);

const MyAccount = () => {
  const { user, updateUser } = useAuth();

  const [info, setInfo] = React.useState({
    displayName: user?.name || "",
    title: user?.title || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    phone: user?.phone || "",
  });

  React.useEffect(() => {
    if (user) {
      setInfo((prev) => ({
        ...prev,
        displayName: user.name,
        title: user.title || "",
        firstName: user.name.split(" ")[0],
        lastName: user.name.split(" ").slice(1).join(" ") || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    if (!user?.uid) return;
    const fullName = `${info.firstName} ${info.lastName}`.trim();
    const newName = fullName || info.displayName;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: newName,
        title: info.title,
        phone: info.phone,
        updatedAt: serverTimestamp(),
      });
      updateUser({
        name: newName,
        title: info.title,
        phone: info.phone,
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h2 className="text-3xl font-serif text-white mb-2">Account</h2>
          <p className="text-gray-400 text-sm">
            View and edit your personal info below.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2 text-white border border-white/20 hover:border-white/40 transition-colors text-sm">
            Discard
          </button>
          <button
            onClick={handleUpdate}
            className="px-6 py-2 bg-[#c16e41] text-white hover:bg-[#a05a32] transition-colors text-sm"
          >
            Update Info
          </button>
        </div>
      </div>

      {/* Display Info */}
      <div className="space-y-8 mb-16">
        <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">
          Display Info
        </h3>
        <p className="text-gray-400 text-sm -mt-6 mb-6">
          This information will be visible to all members of this site.
        </p>

        <div className="flex gap-12">
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-white text-sm mb-2">
                Display name *
              </label>
              <input
                type="text"
                name="displayName"
                value={info.displayName}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={info.title}
                onChange={handleChange}
                placeholder=""
                className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="w-1/3">
            <label className="block text-white text-sm mb-4">
              Profile image
            </label>
            <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white/50 text-xs">Image</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="space-y-8 mb-16">
        <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">
          Personal info
        </h3>
        <p className="text-gray-400 text-sm -mt-6 mb-6">
          Update your personal information.
        </p>

        <div className="grid grid-cols-2 gap-8">
          <div className="relative">
            <label className="block text-white text-sm mb-2">
              First name
            </label>
            <input
              type="text"
              name="firstName"
              value={info.firstName}
              onChange={handleChange}
              className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
            />
            <Lock
              size={14}
              className="absolute right-4 top-[42px] text-[#c16e41]"
            />
          </div>
          <div className="relative">
            <label className="block text-white text-sm mb-2">Last name</label>
            <input
              type="text"
              name="lastName"
              value={info.lastName}
              onChange={handleChange}
              className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
            />
            <Lock
              size={14}
              className="absolute right-4 top-[42px] text-[#c16e41]"
            />
          </div>
          <div className="relative col-span-1">
            <label className="block text-white text-sm mb-2">Phone</label>
            <div className="flex gap-2 items-center">
              <span className="px-3 py-2 rounded-sm bg-white/10 text-white text-sm border border-white/20">
                +91
              </span>
              <input
                type="text"
                name="phone"
                value={info.phone}
                onChange={(e) =>
                  setInfo({
                    ...info,
                    phone: e.target.value.replace(/^\+?91/, ""),
                  })
                }
                className="w-full bg-transparent border border-white/20 p-3 text-white focus:border-[#c16e41] focus:outline-none transition-colors"
              />
            </div>
            <Lock
              size={14}
              className="absolute right-4 top-[42px] text-[#c16e41]"
            />
          </div>
        </div>
      </div>

      {/* Login Info */}
      <div className="space-y-8 mb-16">
        <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">
          Login info
        </h3>
        <p className="text-gray-400 text-sm -mt-6 mb-6">
          View and update your login email and password.
        </p>

        <div className="space-y-6">
          <div>
            <p className="text-white text-sm mb-1">Login email:</p>
            <p className="text-white font-medium">{user?.email}</p>
            <button className="text-[#c16e41] text-sm mt-2 hover:underline">
              Change Email
            </button>
          </div>
          <div>
            <p className="text-white text-sm mb-1">Password:</p>
            <p className="text-white font-medium tracking-widest">••••••••</p>
            <button className="text-[#c16e41] text-sm mt-2 hover:underline">
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-6 mb-12">
        <h3 className="text-lg text-white font-medium border-b border-white/10 pb-4">
          Visibility and privacy
        </h3>
        <p className="text-gray-400 text-sm -mt-6">
          Update your personal information.
        </p>

        {/* <div className="space-y-0 text-white">
          {["Profile URL", "Profile privacy", "Blocked members"].map(
            (item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-4 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 transition-colors"
              >
                <span>{item}</span>
                <ChevronDown size={16} className="text-white/50" />
              </div>
            )
          )}
        </div> */}
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <button className="px-6 py-2 text-white border border-white/20 hover:border-white/40 transition-colors text-sm">
          Discard
        </button>
        <button
          onClick={handleUpdate}
          className="px-6 py-2 bg-[#c16e41] text-white hover:bg-[#a05a32] transition-colors text-sm"
        >
          Update Info
        </button>
      </div>
    </div>
  );
};

// --- Main Layout ---

const UserProfile = () => {
  return (
    <div className="min-h-screen bg-black pt-32">
      <div className="max-w-5xl mx-auto bg-[#0a0a0a] min-h-[800px] border-x border-white/5 shadow-2xl">
        <ProfileHeader />

        {/* Navigation Bar */}
        <div className="border-b border-white/10 px-6 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <NavTab to="/profile" label="Profile" />
          <NavTab to="/profile/orders" label="My Orders" />
          <NavTab to="/profile/my-account" label="My Account" />
          <NavTab to="/profile/addresses" label="My Addresses" />
          <NavTab to="/profile/wallet" label="My Wallet" />

        </div>

        {/* Content Area */}
        <div className="p-8 md:p-12 min-h-[600px]">
          <Routes>
            <Route index element={<ProfileInfo />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="my-account" element={<MyAccount />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route
              path="wishlist"
              element={
                <div className="text-white flex flex-col items-center py-12 border border-white/10 rounded-sm">
                  <Heart size={48} className="text-gray-600 mb-4" />
                  <p className="text-gray-400">Your wishlist is empty.</p>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
