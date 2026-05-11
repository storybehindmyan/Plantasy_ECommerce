# 🌿 Plantasy — Plant E-Commerce Platform

Full-stack plant e-commerce application with a customer storefront, an admin panel, Delhivery logistics integration, Razorpay payments, and WhatsApp Business notifications.

**Live site:** https://plantasy.co.in  
**Admin panel:** https://plantasy.co.in/Admin-plantasy

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, Framer Motion |
| **Admin Panel** | React 19, TypeScript, shadcn/ui, TanStack Query |
| **Backend** | Firebase Functions v2 (Node 20, Express) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Hosting** | Firebase Hosting |
| **Payments** | Razorpay |
| **Logistics** | Delhivery Express API |
| **Notifications** | WhatsApp Business API (Meta) |

---

## Project Structure

```
Plantasy_ECommerce/
├── src/                        # Customer storefront (Vite entry: index.html)
│   ├── pages/                  # Home, Shop, ProductDetails, UserProfile, Checkout…
│   ├── components/             # Layout, CartDrawer, ScrollToTop…
│   ├── hooks/                  # useCheckout, useCart…
│   ├── services/               # OrderService, PaymentService, RazorpayService…
│   ├── context/                # AuthContext, CartContext, ProductContext
│   └── server/                 # Local Express dev server (mirrors Firebase Functions)
│
├── Admin-plantasy/             # Admin panel (Vite entry: Admin-plantasy/index.html)
│   └── src/
│       ├── pages/              # Dashboard, Orders, Products, Coupons, Blogs…
│       ├── services/           # orderService, logisticsService, productService…
│       └── context/            # AuthContext (checks /admins Firestore collection)
│
├── functions/                  # Firebase Cloud Functions — the backend API
│   └── src/
│       ├── index.ts            # Express app entry, CORS config
│       ├── routes/
│       │   ├── razorpay.ts     # POST /api/razorpay/create-order, verify-payment
│       │   ├── orders.ts       # POST /api/orders/paid|confirm|shipped|delivered
│       │   ├── delhivery.ts    # POST /api/delhivery/waybill|retry-pickup|sync-all…
│       │   ├── shipping.ts     # POST /api/shipping/quote, GET /verify/:pincode
│       │   └── whatsapp.ts     # Webhook + cart/checkout/payment notifications
│       └── services/
│           ├── DelhiveryService.ts   # Shipment creation, pickup scheduling, tracking
│           ├── OrderService.ts       # Order lifecycle + Firestore updates
│           └── WhatsAppService.ts    # WhatsApp template message sender
│
├── firestore.rules             # Production Firestore security rules
├── firestore.indexes.json      # Composite index definitions
├── firebase.json               # Hosting rewrites + Functions config
└── .env.example                # All required environment variables (template)
```

---

## Order Lifecycle

```
Customer pays (Razorpay)
        │
        ▼
POST /api/orders/paid
  → DelhiveryService.createShipment()     creates waybill (AWB)
  → Firestore: orderStatus = PENDING
  → WhatsApp: "Order placed" confirmation
        │
        ▼
Admin confirms order in admin panel
        │
        ▼
POST /api/delhivery/waybill  →  OrderService.onOrderConfirm()
  → DelhiveryService.schedulePickup()     books Delhivery pickup for next day
  → Firestore: orderStatus = CONFIRMED, pickupScheduled = true, trackingUrl updated
  → WhatsApp: "Order packed + live tracking link"
        │
        ▼
Admin opens Orders page (auto-sync on page load)
POST /api/delhivery/sync-all
  → Polls Delhivery tracking for all CONFIRMED/SHIPPED orders
  → Auto-updates status → SHIPPED or DELIVERED
  → WhatsApp: shipped/delivered notifications (idempotent — once per transition)
```

**Customer-facing status labels** (shown in user profile):

| Firestore value | Displayed as |
|---|---|
| `PENDING` | Order Placed |
| `CONFIRMED` | Order Packed |
| `SHIPPED` | Shipped |
| `DELIVERED` | Delivered |
| `CANCELLED` | Cancelled |

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (configured in `.firebaserc`)

### Setup

```bash
# 1. Install root dependencies (storefront + admin panel)
npm install

# 2. Install Firebase Functions dependencies
cd functions && npm install && cd ..

# 3. Install local server dependencies
cd src/server && npm install && cd ../..

# 4. Copy env template and fill in values
cp .env.example .env
# Set USE_MOCK_DELIVERY=true and leave WHATSAPP_TOKEN blank for local dev

# 5. Start frontend (port 5000) + local backend (port 3000) concurrently
npm run dev
```

Vite proxies all `/api/*` requests to `http://localhost:3000` (local Express server).

- Storefront: http://localhost:5000  
- Admin panel: http://localhost:5000/Admin-plantasy

---

## Deployment

```bash
# Build both storefront and admin panel
npm run build

# Deploy everything (hosting + functions + Firestore rules + indexes)
firebase deploy

# Targeted deploys
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

The GitHub Actions workflow (`.github/workflows/firebase-hosting-merge.yml`) auto-deploys on push to `main`.

### Firebase Functions — setting environment variables

```bash
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set DELHIVERY_API_KEY
firebase functions:secrets:set WHATSAPP_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
# …and so on for all variables listed in .env.example
```

---

## API Reference

All routes require a Firebase ID token (`Authorization: Bearer <token>`) **except**:
- `GET/POST /api/whatsapp/webhook` (Meta webhook)
- `POST /api/shipping/quote` and `GET /api/shipping/verify/:pincode`

### Razorpay
| Method | Path | Description |
|---|---|---|
| POST | `/api/razorpay/create-order` | Create a Razorpay payment order |
| POST | `/api/razorpay/verify-payment` | Verify Razorpay payment signature |

### Orders
| Method | Path | Description |
|---|---|---|
| POST | `/api/orders/paid` | Create Delhivery waybill after successful payment |
| POST | `/api/orders/confirm` | Confirm order — admin use |
| POST | `/api/orders/shipped` | Mark order as shipped — admin use |
| POST | `/api/orders/delivered` | Mark order as delivered — admin use |

### Delhivery
| Method | Path | Description |
|---|---|---|
| POST | `/api/delhivery/waybill` | Confirm order: create waybill + schedule pickup |
| POST | `/api/delhivery/retry-pickup` | Re-schedule pickup for a CONFIRMED order |
| POST | `/api/delhivery/track-sync` | Sync tracking + auto-update status for one order |
| POST | `/api/delhivery/sync-all` | Sync all active orders (called on admin page load) |
| GET  | `/api/delhivery/track` | Raw Delhivery tracking data for a waybill |
| POST | `/api/delhivery/label` | Get Delhivery packing slip / label URL |

### Shipping
| Method | Path | Description |
|---|---|---|
| POST | `/api/shipping/quote` | Get shipping cost + estimated delivery date |
| GET  | `/api/shipping/verify/:pincode` | Check if a pincode is serviceable |

---

## Firestore Collections

| Collection | Who can read | Who can write |
|---|---|---|
| `products` | Public | Backend only |
| `categories`, `blogs` | Public | Backend only |
| `reviews` | Public | Authenticated users (create only) |
| `orders` | Owner + Admins | Owner (create), Admins (update) |
| `users` | Own profile | Own profile |
| `admins` | Own record | Backend only |
| `coupons` | Authenticated | Backend only |
| `support_tickets` | Owner + Admins | Owner (create), Admins (update) |

---

## Environment Variables

See [`.env.example`](.env.example) for the full annotated list.

**Required for production:**
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `VITE_RAZORPAY_KEY_ID`
- `DELHIVERY_API_KEY` + all `WAREHOUSE_*` vars
- `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`

**Mock modes** (for development):
- **Delhivery** — set `USE_MOCK_DELIVERY=true` → fake waybills, no real API calls
- **WhatsApp** — leave `WHATSAPP_TOKEN` empty → messages printed to console only

---

## Delhivery Setup Checklist

- [ ] Create pickup location in Delhivery portal; name must match `WAREHOUSE_NAME` exactly
- [ ] Wallet balance ≥ ₹500 before scheduling pickups
- [ ] `DELHIVERY_BASE_URL=https://ltl-clients-api.delhivery.com` (no `-dev` in production)
- [ ] Tracking URL format: `https://www.delhivery.com/track-v2/package/{waybill}`
