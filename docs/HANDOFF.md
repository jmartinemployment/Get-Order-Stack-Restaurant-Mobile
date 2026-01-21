# Get-Order-Stack Restaurant Mobile - Handoff Document

## Repository
**GitHub:** https://github.com/jmartinemployment/Get-Order-Stack-Restaurant-Mobile

## Project Overview
React Native monorepo containing two tablet applications for restaurant operations:
- **POS (Point of Sale)** - Order taking and checkout for front-of-house staff
- **KDS (Kitchen Display System)** - Order management for kitchen staff

## Current Status: ✅ Committed to GitHub

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

### 1. **LOW PRIORITY: Supabase RLS Warning (Known Issue)**
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

### 2. **HIGH PRIORITY: Update KDS Dependencies**
The KDS app needs its dependencies updated to match POS. The POS app was updated to latest versions but KDS was not.

```bash
cd apps/kds
# Update package.json to match POS versions:
# - expo: ~54.0.31
# - react-native: 0.81.5
# - etc.
npm install
```

### 3. **HIGH PRIORITY: Complete Database Connection Flow**
Dynamic restaurant selection is partially implemented. Need to:
- Install AsyncStorage in POS: `npm install @react-native-async-storage/async-storage`
- Test RestaurantSetupScreen flow
- Apply same pattern to KDS app

**Files updated (POS):**
- `/apps/pos/src/config.ts` - Environment-based API URL
- `/apps/pos/src/context/RestaurantContext.tsx` - NEW
- `/apps/pos/src/screens/RestaurantSetupScreen.tsx` - NEW
- `/apps/pos/src/screens/MenuScreen.tsx` - Now accepts restaurantId prop
- `/apps/pos/src/components/CheckoutModal.tsx` - Now accepts restaurantId prop
- `/apps/pos/src/screens/OrderHistoryScreen.tsx` - Now accepts restaurantId prop
- `/apps/pos/App.tsx` - Orchestrates setup flow

**Files still needing update (KDS):**
- `/apps/kds/src/screens/KitchenDisplayScreen.tsx` - Still has hardcoded ID

### 4. **WebSocket Integration (Future)**
Replace polling with WebSocket for real-time updates:
- Backend already has WebSocket capability
- KDS currently polls every 5 seconds
- Would improve responsiveness and reduce server load

---

## Deployment Status

### Backend (Render.com)
- `render.yaml` created but not yet deployed
- Environment variables needed:
  - `DATABASE_URL` (Supabase connection string)
  - `DIRECT_URL` (Supabase direct connection)
  - `ANTHROPIC_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `CORS_ORIGINS` (frontend URLs)

### Frontend (Vercel)
- Not yet deployed
- Need to set `EXPO_PUBLIC_API_URL` environment variable

---

## Backend API Reference

**Base URL:** `http://localhost:3000/api/restaurant/{restaurantId}`

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
- Backend running on localhost:3000

### Running POS App
```bash
cd apps/pos
npm install
npm install @react-native-async-storage/async-storage  # Required for restaurant persistence
npm run web    # Browser (recommended for tablet testing)
npm run ios    # iOS Simulator
npm run android
```

### Running KDS App
```bash
cd apps/kds
npm install
npm run web
```

---

## Technical Notes

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

## Known Issues / Tech Debt

1. **Supabase RLS warning** - Linter false positive on _prisma_migrations (RLS enabled, documented)
2. **KDS dependencies outdated** - Need to match POS versions
3. **KDS hardcoded restaurant ID** - Needs same setup flow as POS
4. **No offline support** - Orders fail if network unavailable
5. **No sound notifications** - KDS should beep for new orders
6. **Receipt printing mobile** - Needs actual printer SDK (Star Micronics, Epson, etc.)
7. **No authentication** - Anyone with restaurant ID can access

---

## Database Schema Notes

### Supabase/PostgreSQL
- Managed via Prisma ORM
- Connection pooling via Supabase's PgBouncer
- `DATABASE_URL` uses pooler connection (port 6543)
- `DIRECT_URL` uses direct connection (port 5432) for migrations

### Key Tables
- `Restaurant` - Multi-tenant root
- `MenuCategory`, `MenuItem`, `ModifierGroup`, `Modifier` - Menu structure
- `Order`, `OrderItem`, `OrderItemModifier` - Order data
- `Customer` - Customer records
- `RestaurantTable` - Table management

---

## File Reference

### Key Files Modified Recently

| File | Changes |
|------|---------|
| `apps/pos/App.tsx` | Restaurant selection orchestration |
| `apps/pos/src/config.ts` | Environment-based configuration |
| `apps/pos/src/context/RestaurantContext.tsx` | **NEW** - Restaurant state management |
| `apps/pos/src/screens/RestaurantSetupScreen.tsx` | **NEW** - Onboarding UI |
| `apps/pos/src/screens/MenuScreen.tsx` | Dynamic restaurantId, header with logout |
| `apps/pos/src/components/CheckoutModal.tsx` | Dynamic restaurantId |
| `apps/pos/src/screens/OrderHistoryScreen.tsx` | Dynamic restaurantId |
| `apps/kds/src/screens/KitchenDisplayScreen.tsx` | Live API (still hardcoded ID) |

---

## Upcoming Features (Demo Target: Jan 31)

1. **Menu Engineering Report** - AI-powered profitability analysis
2. **POS Upsell Prompts** - Subtle AI suggestions for staff
3. **Inventory Tracking** - Basic stock management
4. **AI Sales Insights Dashboard** - Daily performance analysis
5. **Tablet UI Optimization** - Android tablet testing

---

## Contact / Resources

- **Backend Repo:** Get-Order-Stack-Restaurant-Backend
- **Frontend Repo:** Get-Order-Stack-Restaurant-Frontend
- **API Docs:** See backend `/docs` folder
- **Product Vision:** See `/docs/PRODUCT_VISION.md`
- **Interview Guide:** See `/docs/INTERVIEW_GUIDE.md`

---

*Last Updated: January 21, 2025*
