# Get-Order-Stack Restaurant Mobile - Handoff Document

## Repository
**GitHub:** https://github.com/jmartinemployment/Get-Order-Stack-Restaurant-Mobile

## Project Overview
React Native monorepo containing two tablet applications for restaurant operations:
- **POS (Point of Sale / Order Entry)** - Order taking for front-of-house staff
- **KDS (Kitchen Display System)** - Order management for kitchen staff

## Current Status: ✅ DEPLOYED TO PRODUCTION

---

## 🎯 IMMEDIATE PRIORITY: Saturday Demo

**See:** [`docs/IMPLEMENTATION_PLAN_DEMO.md`](./IMPLEMENTATION_PLAN_DEMO.md) for detailed implementation instructions.

### Demo Flow
```
Order Entry → KDS → Order Entry (Pending Orders)
     │          │           │
   Create    Update      Complete
   Order     Status      Order
```

### Priority 1: Fix Upsell Bar
Connect AI suggestions to real menu data (currently hardcoded)

### Priority 2: Pending Orders Screen
New screen showing all active orders with real-time KDS updates

---

## 🤖 Claude Tooling Notes

**IMPORTANT:** When working with files in this project, use these tools:
- **Use `filesystem:read_file`** to read file contents (NOT `view` - it fails intermittently)
- **Use `filesystem:search_files`** to find files by pattern
- **Use `filesystem:list_directory`** to explore folder structure
- **Use `filesystem:write_file`** or `str_replace`** to modify files

The `view` tool has path resolution issues and often returns "Path not found" even when files exist.

**Consider using Code mode** instead of Chat mode for faster iteration on code changes.

---

## 🚀 Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **POS App** | https://get-order-stack-restaurant-mobile.vercel.app | ✅ Live |
| **Backend API** | https://get-order-stack-restaurant-backend.onrender.com | ✅ Live |
| **KDS App** | https://get-order-stack-restaurant-mobile-j.vercel.app | ✅ Live |

### Test Restaurant IDs
| Restaurant | ID |
|------------|-----|
| Demo Restaurant | `96816829-87e3-4b6a-9f6c-613e4b3ab522` |
| Taipa (more menu items) | `f2cfe8dd-48f3-4596-ab1e-22a28b23ad38` |

---

## 📱 Device Architecture

### Device 1: Server Tablet (Wait Staff)
- Order taking (dine-in focused)
- Pending Orders → Mark DELIVERED
- NO payment processing

### Device 2: Counter POS (Cashier/Expo)
- Order taking (all types)
- Pending Orders → PICKED UP / HANDED OFF
- Payment processing (Stripe)
- Tip entry (future)

### Device 3: Manager Station (Future)
- Tip accounting & allocation
- Bookkeeping & reports
- AI Reservations dashboard
- AI Phone Orders review

### Device 4: KDS (Kitchen)
- View incoming orders
- Bump workflow: Confirm → Start → Done

---

## 🔴 PRIORITY: Demo Features (Saturday)

### 1. **Upsell Bar Fix** ✅ Plan Ready
**Problem:** Currently uses hardcoded demo items
**Solution:** Connect to real menu data from `groupedMenu`
**File:** `apps/pos/src/screens/MenuScreen.tsx`
**Details:** See `IMPLEMENTATION_PLAN_DEMO.md` Priority 1

### 2. **Pending Orders Screen** ✅ Plan Ready
**Problem:** No way to track orders or mark as delivered
**Solution:** New full-screen order tracking with real-time updates
**Files:** 
- Create: `apps/pos/src/screens/PendingOrdersScreen.tsx`
- Modify: `apps/pos/src/contexts/OrderNotificationContext.tsx`
- Modify: `apps/pos/src/screens/MenuScreen.tsx`
**Details:** See `IMPLEMENTATION_PLAN_DEMO.md` Priority 2

---

## 🟡 POST-DEMO: TODO Items

### AI Features (Option B)
- [ ] AI Upsell Backend - Intelligent recommendations via Claude API
- [ ] AI Kitchen Time Estimate - Predict prep time per order
- [ ] AI Dietary Alert - Detect allergy conflicts
- [ ] AI Phone Orders - Voice-to-order system
- [ ] AI Reservations - Automated booking

### Tip Accounting 🔥 High Priority
- [ ] Tip entry at payment time
- [ ] End-of-shift tip report
- [ ] Tip pool configuration
- [ ] Server tip allocation

### Bookkeeping 🔥 High Priority
- [ ] Daily sales report
- [ ] Sales by payment type
- [ ] Cash drawer tracking
- [ ] QuickBooks integration

### Device Management
- [ ] Device registration system
- [ ] Role-based filtering (Server vs Counter)
- [ ] PIN authentication

### Other
- [ ] Persist Chef Picks to backend
- [ ] Checkout mode for UpsellBar
- [ ] Screen orientation lock
- [ ] Offline support

---

## Architecture

```
Get-Order-Stack-Restaurant-Mobile/
├── apps/
│   ├── pos/                    # Point of Sale / Order Entry App
│   │   └── src/
│   │       ├── components/
│   │       │   ├── PlaceOrderModal.tsx
│   │       │   ├── ReceiptPrinter.tsx
│   │       │   ├── PrimaryCategoryNav.tsx
│   │       │   ├── UpsellBar.tsx
│   │       │   ├── ChefInputPanel.tsx
│   │       │   └── OrderNotificationToast.tsx
│   │       ├── contexts/
│   │       │   ├── CartContext.tsx
│   │       │   └── OrderNotificationContext.tsx  # Order tracking
│   │       ├── services/
│   │       │   └── socket.service.ts            # WebSocket
│   │       └── screens/
│   │           ├── MenuScreen.tsx               # Main POS
│   │           ├── PendingOrdersScreen.tsx      # NEW: Order tracking
│   │           ├── OrderHistoryScreen.tsx
│   │           ├── CategoryManagementScreen.tsx
│   │           └── MenuItemManagementScreen.tsx
│   │
│   └── kds/                    # Kitchen Display System
│       └── src/
│           └── screens/
│               └── KitchenDisplayScreen.tsx
│
├── packages/                   # Shared packages (future)
└── docs/                       # Documentation
    ├── HANDOFF.md              # This file
    ├── IMPLEMENTATION_PLAN_DEMO.md  # Demo build plan
    ├── USER_MANUAL.md          # End-user documentation
    └── PRODUCT_VISION.md       # Product strategy
```

---

## Order Status Lifecycle

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐
│ PENDING  │───▶│ CONFIRMED │───▶│ PREPARING │───▶│  READY  │───▶│ COMPLETED │
│ (new)    │    │ (KDS ack) │    │ (cooking) │    │ (done)  │    │(delivered)│
└──────────┘    └───────────┘    └───────────┘    └─────────┘    └───────────┘
     │               │                │               │               │
   Order           KDS             KDS             KDS            POS
   Entry         Confirm          Start           Done          Delivered
```

### Timestamps Captured
| Field | When Set |
|-------|----------|
| `createdAt` | Order created |
| `confirmedAt` | KDS confirms |
| `preparingAt` | KDS starts cooking |
| `readyAt` | KDS marks done |
| `completedAt` | POS marks delivered |
| `cancelledAt` | Order cancelled |

---

## Development Setup

### Running Locally

**Terminal 1 - Backend:**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Backend
npm run dev
```

**Terminal 2 - POS App (browser):**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile
npm run pos
```

**Terminal 3 - KDS App (browser):**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile
npm run kds
```

### Running on iPhone (Expo Go)

```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile
npm run pos:phone
```

### Kill Running Processes
```bash
pkill -f "expo" && pkill -f "node.*pos"
lsof -ti:8081 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

## Backend API Reference

**Base URL:** `https://get-order-stack-restaurant-backend.onrender.com/api/restaurant/{restaurantId}`

### Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/menu/grouped` | GET | Hierarchical menu with primary/sub categories |
| `/menu/items` | GET/POST | Menu items |
| `/orders` | GET | Orders (supports `?status=pending,confirmed,preparing,ready`) |
| `/orders` | POST | Create order |
| `/orders/:id/status` | PATCH | Update status (`changedBy`, `note` supported) |
| `/orders/:id/profit-insight` | GET | AI profit analysis |

### WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `order:new` | Server → Client | Full order object |
| `order:updated` | Server → Client | Full order object with new status |

---

## Key Technical Details

### UpsellBar Current State
- UI component: ✅ Working
- Chef Picks: ✅ Connected to menu
- Popular items: ❌ Hardcoded
- High-margin items: ❌ Hardcoded
- **Fix:** See `IMPLEMENTATION_PLAN_DEMO.md`

### WebSocket Service
- File: `apps/pos/src/services/socket.service.ts`
- Connects to: `wss://get-order-stack-restaurant-backend.onrender.com`
- Auto-reconnect: Yes
- Polling fallback: 30 seconds

### Order Notification Context
- File: `apps/pos/src/contexts/OrderNotificationContext.tsx`
- Handles: WebSocket events, active orders, notifications
- **Needs update** for Pending Orders screen

---

## Session Transcripts
Previous conversation transcripts available at:
- `/mnt/transcripts/2026-01-27-*.txt` - Latest session
- `/mnt/transcripts/2026-01-23-*.txt` - Menu management updates

---

*Last Updated: January 27, 2026*
