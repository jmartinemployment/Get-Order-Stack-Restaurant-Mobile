# Pre-Demo Technical Checklist
## Goal: Have something demoable for in-law dinner (~2 weeks)

---

## Current State Assessment

### ✅ Working
- POS: Menu browsing, cart, modifiers, checkout, order submission
- POS: Receipt printing (web), order history
- POS: Special instructions, table selection (dine-in)
- KDS: Live order feed, status bumping, real-time polling
- Backend: Full API for menus, orders, tables, customers

### 🔴 Blocking Demo
- **Hardcoded restaurant ID** - Can't create new restaurant
- **No authentication** - Anyone can access any restaurant
- **Localhost only** - Can't demo on their network

### 🟡 Would Be Nice for Demo
- Basic sales reporting
- Sound/notification on KDS for new orders
- Cleaner onboarding flow

---

## Priority Tasks for Demo

### P0: Must Have (Do First)

#### 1. Deploy to Public URL
**Why:** Can't demo localhost at their restaurant
**Tasks:**
- [ ] Deploy backend to Render.com (production)
- [ ] Deploy POS web app to Vercel/Netlify
- [ ] Deploy KDS web app to Vercel/Netlify
- [ ] Set up production database (Supabase)
- [ ] Configure environment variables

**Estimate:** 2-4 hours

#### 2. Restaurant Onboarding
**Why:** Need to create their restaurant in the system
**Tasks:**
- [ ] Simple "Create Restaurant" form (name, address, tax rate)
- [ ] Generate restaurant ID
- [ ] Store/retrieve restaurant ID in app (localStorage for now)
- [ ] Remove hardcoded restaurant ID from all files

**Files to Update:**
- `/apps/pos/src/screens/MenuScreen.tsx`
- `/apps/pos/src/components/CheckoutModal.tsx`
- `/apps/pos/src/screens/OrderHistoryScreen.tsx`
- `/apps/kds/src/screens/KitchenDisplayScreen.tsx`

**Estimate:** 4-6 hours

#### 3. Menu Seeding / Import
**Why:** Need their actual menu items to demo
**Tasks:**
- [ ] Simple menu management UI (add category, add item)
- [ ] OR: Backend script to seed menu from JSON
- [ ] OR: Manual entry via API (Postman/curl)

**Estimate:** 2-4 hours (depending on approach)

---

### P1: Should Have (If Time)

#### 4. Basic Daily Sales Report
**Why:** Shows business value beyond just taking orders
**Tasks:**
- [ ] Endpoint: GET /orders/summary?date=YYYY-MM-DD
- [ ] Simple dashboard showing: total sales, order count, avg ticket
- [ ] Accessible from POS

**Estimate:** 3-4 hours

#### 5. KDS Audio Alert
**Why:** Kitchen staff won't stare at screen constantly
**Tasks:**
- [ ] Play sound when new order arrives
- [ ] Browser notification permission request
- [ ] Volume control

**Estimate:** 1-2 hours

#### 6. Update KDS Dependencies
**Why:** Technical debt, potential runtime issues
**Tasks:**
- [ ] Match POS package.json versions
- [ ] Test all KDS functionality

**Estimate:** 1-2 hours

---

### P2: Nice to Have (Stretch)

#### 7. Simple Login
**Why:** Professionalism, security perception
**Tasks:**
- [ ] PIN-based login for staff
- [ ] Restaurant selection screen
- [ ] Session persistence

**Estimate:** 4-6 hours

#### 8. Receipt Printer Integration (Physical)
**Why:** Wow factor, real-world usability
**Tasks:**
- [ ] Research Star Micronics / Epson web printing
- [ ] ESC/POS command generation
- [ ] Test with actual hardware

**Estimate:** 6-8 hours (plus hardware purchase)

#### 9. Tablet UI Optimization
**Why:** Demo device might be tablet, not desktop
**Tasks:**
- [ ] Test on Samsung tablet
- [ ] Adjust layouts for tablet dimensions
- [ ] Touch target sizing

**Estimate:** 2-4 hours

---

## Demo Script (Draft)

### Setup Before Dinner
1. Ensure backend is running (production URL)
2. Create their restaurant in system
3. Add 5-10 menu items from their actual menu
4. Open POS on one device (your phone/tablet)
5. Open KDS on another device (laptop browser)

### Demo Flow (5-10 minutes)

**"Let me show you what I've been working on..."**

1. **POS - Browse Menu**
   - "This is the ordering screen your cashier would see"
   - Show categories, items, prices
   - "Your actual menu items are already in here"

2. **POS - Take an Order**
   - Add 2-3 items to cart
   - Select a modifier
   - Add special instructions ("no onions")
   - Select dine-in + table number

3. **POS - Checkout**
   - Enter customer name
   - Show tax calculation
   - "Place Order" (skip payment for demo)

4. **KDS - Order Appears**
   - "Watch the kitchen screen..."
   - Order appears in NEW column
   - "The cook sees exactly what to make"
   - Show special instructions highlighted

5. **KDS - Bump Order**
   - Click START → moves to COOKING
   - Click DONE → moves to READY
   - "Simple, fast, no paper tickets"

6. **POS - Order History**
   - Show the order just placed
   - "You can see all orders, reprint receipts"

7. **The Hook**
   - "This is just the beginning..."
   - "Imagine knowing your food cost per dish"
   - "Imagine AI telling you what's profitable"
   - "Imagine not paying Toast 3% of every sale"

---

## Technical Notes for Demo Environment

### Backend Production Deploy (Render.com)
```bash
# Environment variables needed:
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend Deploy (Vercel)
```bash
# POS App
cd apps/pos
npm run build
# Deploy dist folder

# KDS App  
cd apps/kds
npm run build
# Deploy dist folder
```

### Database Setup
- Create new Supabase project for production
- Run Prisma migrations
- Seed with demo restaurant

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Wifi issues at restaurant | Have mobile hotspot backup |
| Demo device dies | Charge everything, bring charger |
| Backend crashes | Have localhost fallback ready |
| Menu items wrong | Verify with spouse before dinner |
| They're not interested | That's okay - it's learning, not selling |

---

## Time Budget (Assuming 2 weeks, part-time)

| Task | Hours | Priority |
|------|-------|----------|
| Deploy to production | 3 | P0 |
| Restaurant onboarding | 5 | P0 |
| Menu seeding | 3 | P0 |
| Basic reporting | 4 | P1 |
| KDS audio alert | 2 | P1 |
| KDS dependencies | 2 | P1 |
| **Total P0+P1** | **19 hours** | |

If working ~2 hours/day = 14 hours/week = P0+P1 achievable

---

*Document Version: 1.0*
*Created: January 21, 2025*
