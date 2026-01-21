# Get-Order-Stack Restaurant Mobile - Handoff Document

## Repository
**GitHub:** https://github.com/jmartinemployment/Get-Order-Stack-Restaurant-Mobile

## Project Overview
React Native monorepo containing two tablet applications for restaurant operations:
- **POS (Point of Sale)** - Order taking and checkout for front-of-house staff
- **KDS (Kitchen Display System)** - Order management for kitchen staff

## Current Status: ✅ DEPLOYED TO PRODUCTION

---

## 🚀 Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **POS App** | https://get-order-stack-restaurant-mobile.vercel.app | ✅ Live |
| **Backend API** | https://get-order-stack-restaurant-backend.onrender.com | ✅ Live |
| **KDS App** | Not yet deployed | 🔴 Pending |

### Test Restaurant IDs
| Restaurant | ID |
|------------|-----|
| Demo Restaurant | `96816829-87e3-4b6a-9f6c-613e4b3ab522` |
| Taipa (more menu items) | `f2cfe8dd-48f3-4596-ab1e-22a28b23ad38` |

---

## Architecture

```
Get-Order-Stack-Restaurant-Mobile/
├── apps/
│   ├── pos/                    # Point of Sale App
│   │   └── src/
│   │       ├── components/
│   │       │   ├── CheckoutModal.tsx      # Checkout with table selection
│   │       │   └── ReceiptPrinter.tsx     # Receipt preview & printing
│   │       ├── context/
│   │       │   ├── CartContext.tsx        # Cart state management
│   │       │   └── RestaurantContext.tsx  # Dynamic restaurant selection
│   │       └── screens/
│   │           ├── MenuScreen.tsx         # Main POS interface
│   │           ├── OrderHistoryScreen.tsx # Past orders view
│   │           └── RestaurantSetupScreen.tsx # Restaurant onboarding
│   │
│   └── kds/                    # Kitchen Display System
│       └── src/
│           └── screens/
│               └── KitchenDisplayScreen.tsx  # Kitchen order board
│
├── packages/                   # Shared packages (future)
└── docs/                       # Documentation
```

---

## Features Implemented

### POS App ✅
| Feature | Status | Description |
|---------|--------|-------------|
| Restaurant Setup | ✅ Complete | Connect to existing or create new restaurant |
| Menu Display | ✅ Complete | Grid layout with categories, images, prices |
| Cart Management | ✅ Complete | Add, remove, update quantity, clear cart |
| Modifier Selection | ✅ Complete | Single/multi-select modifiers with prices |
| Special Instructions | ✅ Complete | Per-item notes (e.g., "no onions") |
| Table Selection | ✅ Complete | Table picker for dine-in orders |
| Checkout Flow | ✅ Complete | Customer info, order type, tax calculation |
| Order Submission | ✅ Complete | Creates order via REST API |
| Receipt Printing | ✅ Complete | Preview modal with print functionality |
| Order History | ✅ Complete | View past orders, reprint receipts |

### KDS App ✅
| Feature | Status | Description |
|---------|--------|-------------|
| Live Order Feed | ✅ Complete | Polls API every 5 seconds |
| 3-Column Layout | ✅ Complete | NEW → COOKING → READY columns |
| Order Cards | ✅ Complete | Shows items, modifiers, special instructions |
| Status Bumping | ✅ Complete | Advances order through workflow |
| Table Display | ✅ Complete | Shows table number for dine-in |
| Urgent Highlighting | ✅ Complete | Red border for orders >10 min |
| Manual Refresh | ✅ Complete | Refresh button + auto-polling |

---

## 🔴 PRIORITY: Action Items for Next Developer

### 1. **HIGH PRIORITY: Deploy KDS App**
KDS needs to be deployed to Vercel like the POS app.

### 2. **HIGH PRIORITY: Update KDS for Dynamic Restaurant**
The KDS app still has a hardcoded restaurant ID. Need to:
- Apply same pattern as POS (RestaurantSetupScreen, config.ts)
- Update dependencies to match POS versions

**Files needing update (KDS):**
- `/apps/kds/src/screens/KitchenDisplayScreen.tsx` - Still has hardcoded ID

### 3. **LOW PRIORITY: Supabase RLS Warning (Known Issue)**
Supabase Security Advisor flags `public._prisma_migrations` table for RLS. 

**Status:** RLS has been enabled and policy created, but Splinter (Supabase's linter) continues to flag it. This appears to be a false positive or cache issue.

**What was done:**
```sql
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public._prisma_migrations
  FOR ALL
  USING (auth.role() = 'service_role');
```

**Why we're moving on:** The `_prisma_migrations` table contains only migration metadata (names, timestamps, checksums) - no sensitive data. This is a low-risk item that can be revisited post-demo if needed.

### 4. **WebSocket Integration (Future)**
Replace polling with WebSocket for real-time updates:
- Backend already has WebSocket capability
- KDS currently polls every 5 seconds
- Would improve responsiveness and reduce server load

---

## Deployment Details

### Backend (Render.com) ✅ DEPLOYED
- **URL:** https://get-order-stack-restaurant-backend.onrender.com
- **Health Check:** https://get-order-stack-restaurant-backend.onrender.com/health
- **Instance:** Free tier (sleeps after 15 min inactivity, ~30-60s cold start)

**Environment Variables Set:**
| Key | Description |
|-----|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Supabase pooler connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432) |
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `STRIPE_SECRET_KEY` | Stripe test key |
| `STRIPE_WEBHOOK_SECRET` | Placeholder (webhooks not configured) |
| `CORS_ORIGINS` | `http://localhost:8081,http://localhost:19006,https://get-order-stack-restaurant-mobile.vercel.app` |

### POS Frontend (Vercel) ✅ DEPLOYED
- **URL:** https://get-order-stack-restaurant-mobile.vercel.app
- **Root Directory:** `apps/pos`
- **Build Command:** `npx expo export --platform web`
- **Output Directory:** `dist`

**Config Notes:**
- API URL detection is automatic based on hostname (see `/apps/pos/src/config.ts`)
- If on localhost → uses `http://localhost:3000`
- If on Vercel → uses `https://get-order-stack-restaurant-backend.onrender.com`

---

## Backend API Reference

**Production Base URL:** `https://get-order-stack-restaurant-backend.onrender.com/api/restaurant/{restaurantId}`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Create new restaurant |
| `/:restaurantId` | GET | Get restaurant details |
| `/menu` | GET | Full menu with categories, items, modifiers |
| `/tables` | GET | Available tables for dine-in |
| `/orders` | GET | List orders (supports `?limit=50&status=pending`) |
| `/orders` | POST | Create new order |
| `/orders/:id/status` | PATCH | Update order status |

### Order Creation Payload
```json
{
  "customerInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-1234"
  },
  "orderType": "dine-in",
  "orderSource": "pos",
  "tableId": "table-uuid",
  "items": [
    {
      "menuItemId": "item-uuid",
      "quantity": 2,
      "specialInstructions": "No onions",
      "modifiers": [
        { "modifierId": "modifier-uuid" }
      ]
    }
  ]
}
```

### Order Status Flow
```
pending → confirmed → preparing → ready → completed
                                       ↘ cancelled
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Backend running on localhost:3000 (or use production URL)

### Running POS App Locally
```bash
cd apps/pos
npm install
npm install @react-native-async-storage/async-storage  # Required for restaurant persistence
npm run web    # Browser (recommended for tablet testing)
npm run ios    # iOS Simulator
npm run android
```

### Running KDS App Locally
```bash
cd apps/kds
npm install
npm run web
```

---

## Technical Notes

### Styling
- Uses **React Native StyleSheet** (not Tailwind, Bootstrap, or any CSS library)
- Styles are JavaScript objects with camelCase properties
- When rendered to web, generates inline styles or hashed class names

### Cart State Management
Uses React Context with useReducer pattern. Supports:
- Adding items with modifiers and special instructions
- Quantity updates (increment/decrement)
- Item removal
- Full cart clear

### Restaurant Selection
- Uses AsyncStorage to persist selected restaurant
- RestaurantSetupScreen shown when no restaurant selected
- Can create new restaurant or connect to existing by ID

### Receipt Printing
- Web: Opens browser print dialog with formatted HTML
- Mobile: Placeholder Alert (needs thermal printer SDK integration)

### Tax Calculation
Currently hardcoded at 6.5% (Florida). Backend supports per-restaurant tax rates with auto-lookup by ZIP code.

---

## Database Notes

### Supabase/PostgreSQL
- Managed via Prisma ORM
- Connection pooling via Supabase's PgBouncer
- `DATABASE_URL` uses pooler connection (port 6543)
- `DIRECT_URL` uses direct connection (port 5432) for migrations

### Key Tables (use lowercase in SQL queries)
```sql
SELECT id, name, slug FROM restaurants;  -- List all restaurants
```

| Table | Description |
|-------|-------------|
| `restaurants` | Multi-tenant root |
| `menu_categories` | Menu sections |
| `menu_items` | Food/drink items |
| `modifier_groups` | Groups of modifiers |
| `modifiers` | Individual modifier options |
| `orders` | Order records |
| `order_items` | Items within orders |
| `order_item_modifiers` | Modifiers on order items |
| `customers` | Customer records |
| `restaurant_tables` | Table management |

---

## Known Issues / Tech Debt

1. **Supabase RLS warning** - Linter false positive on _prisma_migrations (RLS enabled, documented)
2. **KDS not deployed** - Needs Vercel deployment
3. **KDS hardcoded restaurant ID** - Needs same setup flow as POS
4. **No offline support** - Orders fail if network unavailable
5. **No sound notifications** - KDS should beep for new orders
6. **Receipt printing mobile** - Needs actual printer SDK (Star Micronics, Epson, etc.)
7. **No authentication** - Anyone with restaurant ID can access
8. **Render free tier** - Backend sleeps after 15 min, cold start delay

---

## Upcoming Features (Demo Target: Jan 31)

1. **Menu Engineering Report** - AI-powered profitability analysis
2. **POS Upsell Prompts** - Subtle AI suggestions for staff
3. **AI Sales Insights Dashboard** - Daily performance analysis
4. **Tablet UI Optimization** - Android tablet testing

---

## Contact / Resources

- **Backend Repo:** Get-Order-Stack-Restaurant-Backend
- **Mobile Repo:** Get-Order-Stack-Restaurant-Mobile
- **Product Vision:** See `/docs/PRODUCT_VISION.md`
- **Interview Guide:** See `/docs/INTERVIEW_GUIDE.md`
- **Demo Checklist:** See `/docs/PRE_DEMO_CHECKLIST.md`

---

*Last Updated: January 21, 2025*
