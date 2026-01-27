# OrderStack User Manual
## The Restaurant Operating System Built for Independents

**Version:** 1.0  
**Last Updated:** January 27, 2026

---

## Table of Contents

1. [Welcome to OrderStack](#welcome-to-orderstack)
2. [Getting Started](#getting-started)
3. [Point of Sale (POS)](#point-of-sale-pos)
4. [Pending Orders](#pending-orders)
5. [Kitchen Display System (KDS)](#kitchen-display-system-kds)
6. [Menu Management](#menu-management)
7. [Order Lifecycle](#order-lifecycle)
8. [Reports & Analytics](#reports--analytics)
9. [Troubleshooting](#troubleshooting)
10. [Glossary](#glossary)

---

## Welcome to OrderStack

### What is OrderStack?

OrderStack is a modern restaurant operating system designed specifically for independent restaurants. Unlike bloated enterprise solutions that charge you for hardware and take a cut of every sale, OrderStack lets you:

- **Use your own devices** - Any tablet, phone, or computer works
- **Pay only for what you use** - Modular pricing, no hidden fees
- **Work offline** - Internet down? Keep taking orders
- **Get AI-powered insights** - Not just reports, but recommendations

### Our Philosophy

> *"Would a tired restaurant owner at 11pm understand this instantly?"*

Every screen, every button, every workflow in OrderStack is designed with this question in mind. We know you're busy. We know you're tired. We built software that gets out of your way and lets you focus on your food and your guests.

### Core Modules

| Module | What It Does | Status |
|--------|--------------|--------|
| **POS** | Take orders, process payments, manage tables | ✅ Available |
| **KDS** | Kitchen display for order management | ✅ Available |
| **Menu Management** | Categories, items, modifiers, pricing | ✅ Available |
| **Order Management** | Track orders from creation to completion | ✅ Available |
| **Inventory** | Track stock, recipe costing | 🔜 Coming Soon |
| **Reporting** | Sales dashboards, analytics | 🔜 Coming Soon |
| **Online Ordering** | Customer-facing ordering | 🔜 Coming Soon |

---

## Getting Started

### System Requirements

OrderStack runs on almost any modern device:

| Device Type | Minimum Requirements |
|-------------|---------------------|
| **Tablets** | iPad (2018+), Android tablet (Android 10+) |
| **Phones** | iPhone 8+, Android phone (Android 10+) |
| **Computers** | Chrome, Safari, Firefox, Edge (latest versions) |

**Recommended Setup:**
- **POS**: 10"+ tablet in landscape mode
- **KDS**: 10"+ tablet or dedicated monitor
- **Receipt Printer**: Any ESC/POS compatible printer (Star, Epson)

### Accessing OrderStack

**Web Access (Any Device):**
- POS: `https://get-order-stack-restaurant-mobile.vercel.app`
- KDS: `https://get-order-stack-restaurant-mobile-j.vercel.app`

**Mobile Apps:**
- Download from App Store (iOS) or Play Store (Android)
- Or add the web app to your home screen for app-like experience

### First-Time Setup

1. **Log In** with your credentials
2. **Select Your Restaurant** from the list (if you have multiple)
3. **Choose Your Role**: POS for front-of-house, KDS for kitchen
4. **Start Taking Orders!**

---

## Point of Sale (POS)

### Overview

The POS is your front-of-house command center. Use it to:
- Browse your menu
- Build orders with modifiers
- Process payments
- View order history

### Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🍽️ OrderStack POS          [EN/ES] [History] [Menu Mgmt]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │                     │  │                              │  │
│  │   PRIMARY CATEGORY  │  │      MENU ITEMS GRID         │  │
│  │   NAVIGATION        │  │                              │  │
│  │                     │  │   [Item] [Item] [Item]       │  │
│  │   🥗 Appetizers     │  │   [Item] [Item] [Item]       │  │
│  │   🍽️ Entrees        │  │   [Item] [Item] [Item]       │  │
│  │   🥤 Beverages      │  │                              │  │
│  │   🍰 Desserts       │  │                              │  │
│  │                     │  │                              │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│                                                              │
│  ════════════ CEVICHES ══════════════════════════════════   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💡 Chef Pick: Try our Lomo Saltado! Popular today   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  CART: 3 items                           Subtotal: $45.00   │
│  [View Cart]                              [Checkout →]      │
└─────────────────────────────────────────────────────────────┘
```

### Taking an Order

1. **Select Primary Category** (left sidebar)
   - Appetizers, Entrees, Beverages, etc.
   
2. **Browse Subcategories** (ribbon headers in menu area)
   - Scroll to find specific sections like "Ceviches" or "Grilled Dishes"

3. **Tap an Item** to add to cart
   - If the item has modifiers, a modal will appear

4. **Choose Modifiers** (if applicable)
   - Required modifiers shown with asterisk (*)
   - Select size, preparation style, add-ons, etc.

5. **Add Special Instructions** (optional)
   - "No onions", "Extra spicy", etc.

6. **Review Cart** and proceed to checkout

### Modifiers Explained

Modifiers customize menu items. For example:

| Menu Item | Modifier Group | Options |
|-----------|---------------|---------|
| Ceviche | Spice Level | Mild, Medium, Hot |
| Burger | Cooking Temp | Rare, Medium, Well Done |
| Coffee | Size | Small (+$0), Medium (+$1), Large (+$2) |
| Salad | Dressing | Ranch, Caesar, Vinaigrette |

**Modifier Rules:**
- **Required**: Must select before adding to cart
- **Optional**: Can skip
- **Single Select**: Choose one option
- **Multi Select**: Choose multiple (e.g., pizza toppings)

### Processing Payment

1. Tap **[Checkout]**
2. Review order summary
3. Select **Order Type**:
   - 🍽️ **Dine-In**: Assign to a table
   - 🥡 **Pickup**: Customer name required
   - 🚗 **Delivery**: Address required
4. Choose **Payment Method**:
   - 💳 Card (Stripe integration)
   - 💵 Cash
   - 📱 Other (gift card, etc.)
5. Complete transaction
6. Order automatically appears on KDS

### Language Toggle

OrderStack supports bilingual menus (Spanish/English):

- Tap **[EN/ES]** in the header to switch languages
- Menu items, modifiers, and categories all translate
- Great for multilingual staff or customers

---

## Pending Orders

### Overview

The Pending Orders screen is your real-time order tracker. It shows all active orders from creation to delivery, with live updates as the kitchen progresses through each order.

**Access:** Open the left drawer (☰) → Tap **"🔔 Pending Orders"**

### Why Use Pending Orders?

- **Track all your orders** in one place
- **See real-time updates** as kitchen bumps orders through workflow
- **Know when food is ready** without walking to the kitchen
- **Mark orders as delivered** to complete the cycle and capture timing data

### Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ←  Pending Orders                              🔄 ● Live   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [📋 All (6)]    [🍽️ Tables (4)]    [📦 Pickup/Delivery (2)]│
│  ━━━━━━━━━━━━                                                │
│                                                              │
│  [All]  [🆕 New (2)]  [🍳 Cooking (2)]  [✅ Ready (2)]      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1042              🍽️ Table 7          ✅ READY  2 min │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  2x  Ceviche Mixto (medium spice)                     │ │
│  │  1x  Pisco Sour  ⚠️ no egg white                      │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                    [✅ DELIVERED]      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #1040              🥡 John Smith       🍳 COOKING 5 min│ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  1x  Lomo Saltado                                     │ │
│  │  2x  Chicha Morada                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tab Navigation

| Tab | Shows | Use Case |
|-----|-------|----------|
| **📋 All** | Every active order | Full visibility |
| **🍽️ Tables** | Dine-in orders only | Wait staff focus |
| **📦 Pickup/Delivery** | Pickup + Delivery | Counter/Expo focus |

### Status Filters

Within each tab, filter by status:

| Filter | What It Shows | Color |
|--------|---------------|-------|
| **All** | Every status | — |
| **🆕 New** | Pending + Confirmed | Blue |
| **🍳 Cooking** | Preparing | Orange |
| **✅ Ready** | Ready for delivery | Green |

### Order Card Details

Each order card shows:

- **Order Number** - #1042
- **Order Type Badge** - 🍽️ Dine-In, 🥡 Pickup, 🚗 Delivery
- **Destination** - Table number, customer name, or address
- **Status Badge** - Current state with color coding
- **Elapsed Time** - How long since order was created
- **Items List** - What was ordered, with modifiers
- **Special Instructions** - Highlighted with ⚠️

### Completing Orders

When an order reaches **READY** status, an action button appears:

| Order Type | Button | What It Means |
|------------|--------|---------------|
| Dine-In | **[✅ DELIVERED]** | Food delivered to table |
| Pickup | **[✅ PICKED UP]** | Customer collected order |
| Delivery | **[✅ HANDED OFF]** | Driver took the order |

**Tapping the button:**
1. Marks order as `completed`
2. Records `completedAt` timestamp
3. Removes order from Pending Orders
4. Removes order from KDS READY column

### Real-Time Updates

The Pending Orders screen stays synchronized with KDS:

```
KDS: Kitchen taps [CONFIRM]
         ↓
Pending Orders: Status changes to "CONFIRMED"
         ↓
KDS: Kitchen taps [START]
         ↓
Pending Orders: Order moves to "COOKING" with orange badge
         ↓
KDS: Kitchen taps [DONE]
         ↓
Pending Orders: Order shows "READY" with green badge + action button
         ↓
Server: Taps [DELIVERED]
         ↓
Both: Order disappears, timing captured
```

### Connection Status

The header shows connection status:
- **● Live** (green) - Real-time WebSocket connected
- **● Polling** (orange) - Fallback mode, updates every 30 seconds

Tap **🔄** to manually refresh orders.

### Best Practices

1. **Keep the screen open** during service for instant visibility
2. **Use tab filters** to focus on your role (servers use Tables, expo uses Pickup/Delivery)
3. **Mark orders promptly** when delivered to capture accurate timing
4. **Watch for READY orders** - green cards need immediate attention
5. **Pull to refresh** if you suspect data is stale

---

## Kitchen Display System (KDS)

### Overview

The KDS is your kitchen's command center. It shows all active orders organized by status, allowing kitchen staff to track and manage the cooking workflow efficiently.

### Why This Workflow?

The KDS uses an **industry-standard 5-stage order lifecycle** designed around how real kitchens operate:

```
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐
│ PENDING  │ → │ CONFIRMED │ → │ PREPARING │ → │  READY  │ → │ COMPLETED │
└──────────┘    └───────────┘    └───────────┘    └─────────┘    └───────────┘
     │               │                │               │               │
  Order           Kitchen          Chef is         Food is        Customer
  received        sees it          cooking         plated         received
```

### KDS Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🍳 Kitchen Display          12:45 PM        New: 3  Cooking: 2  Ready: 1│
│  Taipa Restaurant            ● Live                    [🔄] [Switch]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  🔴 NEW ORDERS   │  │  🟠 COOKING      │  │  🟢 READY        │       │
│  │     (3)          │  │     (2)          │  │     (1)          │       │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤       │
│  │                  │  │                  │  │                  │       │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │       │
│  │  │ #1042      │  │  │  │ #1040      │  │  │  │ #1038      │  │       │
│  │  │ PICKUP  5m │  │  │  │ DINE-IN 8m │  │  │  │ DELIVERY   │  │       │
│  │  │            │  │  │  │            │  │  │  │ Table 4    │  │       │
│  │  │ 2x Ceviche │  │  │  │ 1x Lomo    │  │  │  │            │  │       │
│  │  │ 1x Pisco   │  │  │  │   no onion │  │  │  │ 1x Arroz   │  │       │
│  │  │            │  │  │  │ 2x Chicha  │  │  │  │            │  │       │
│  │  │ [CONFIRM]  │  │  │  │            │  │  │  │ [COMPLETE] │  │       │
│  │  └────────────┘  │  │  │ [DONE]     │  │  │  └────────────┘  │       │
│  │                  │  │  └────────────┘  │  │                  │       │
│  │  ┌────────────┐  │  │                  │  │                  │       │
│  │  │ #1043      │  │  │  ┌────────────┐  │  │                  │       │
│  │  │ DINE-IN 2m │  │  │  │ #1041      │  │  │                  │       │
│  │  │ Table 7    │  │  │  │ PICKUP 6m  │  │  │                  │       │
│  │  │            │  │  │  │            │  │  │                  │       │
│  │  │ 1x Tiradito│  │  │  │ 3x Tacos   │  │  │                  │       │
│  │  │            │  │  │  │            │  │  │                  │       │
│  │  │ [START]    │  │  │  │ [DONE]     │  │  │                  │       │
│  │  └────────────┘  │  │  └────────────┘  │  │                  │       │
│  │                  │  │                  │  │                  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Three Columns

| Column | What It Shows | Action Button |
|--------|---------------|---------------|
| 🔴 **NEW ORDERS** | Orders waiting to be started | CONFIRM or START |
| 🟠 **COOKING** | Orders actively being prepared | DONE |
| 🟢 **READY** | Completed orders awaiting pickup/delivery | COMPLETE |

### Understanding the Bump Buttons

The KDS uses a "bump" workflow—tap the button to move an order to the next stage:

#### NEW ORDERS Column (Two Buttons)

**[CONFIRM]** - Appears for brand-new orders (status: `pending`)
- Acknowledges you've seen the order
- Useful for: Verifying order is valid, checking ingredient availability
- Moves order to `confirmed` status (stays in NEW column)

**[START]** - Appears for confirmed orders (status: `confirmed`)
- Indicates you're actively cooking this order
- Moves order to `preparing` status → COOKING column

*Why two steps?* This allows you to:
1. See incoming orders without committing to cook them immediately
2. Catch errors or 86'd items before wasting food
3. Manage your queue during busy periods

#### COOKING Column

**[DONE]** - Tap when food is plated and ready
- Moves order to `ready` status → READY column
- Alerts expo/servers that food is up

#### READY Column

**[COMPLETE]** - Tap when customer has received their order
- For **Dine-In**: Server has delivered to table
- For **Pickup**: Customer has collected their order
- For **Delivery**: Driver has taken the order
- Removes order from KDS

### Order Card Information

Each order card displays:

```
┌────────────────────────┐
│ #1042          PICKUP  │  ← Order number + type badge
│ John Smith        5m   │  ← Customer name + elapsed time
├────────────────────────┤
│ 2x  Ceviche Mixto      │  ← Quantity + Item name
│     Medium spice       │  ← Modifiers
│ 1x  Pisco Sour         │
│     ⚠️ No egg white    │  ← Special instructions (highlighted)
├────────────────────────┤
│       [CONFIRM]        │  ← Action button
└────────────────────────┘
```

**Color Coding:**
- 🟢 Green badge = Pickup
- 🔵 Blue badge = Delivery  
- 🟠 Orange badge = Dine-In

**Urgent Orders:**
- Red border appears when order exceeds 10 minutes
- Elapsed time turns red

### Real-Time Updates

The KDS uses **WebSocket connections** for instant updates:
- New orders appear immediately (no refresh needed)
- Status changes sync across all devices
- Connection indicator shows: ● **Live** (green) or ● **Polling** (orange)

If connection is lost, KDS falls back to polling every 30 seconds.

### KDS Best Practices

1. **Acknowledge orders quickly** - Tap CONFIRM as soon as you see a new order
2. **Start orders in sequence** - Work oldest tickets first (FIFO)
3. **Use DONE accurately** - Only bump when food is actually ready
4. **Complete orders promptly** - Clear the READY column to keep it manageable
5. **Watch the timer** - Red borders mean customers are waiting

---

## Menu Management

### Accessing Menu Management

From the POS screen, tap **[Menu Mgmt]** in the header.

### Menu Hierarchy

OrderStack uses a **two-tier category system**:

```
Primary Category (Top Navigation)
└── Subcategory (Groups within primary)
    └── Menu Items
        └── Modifier Groups
            └── Modifiers
```

**Example:**
```
🍽️ Entrees (Primary)
├── From The Sea (Subcategory)
│   ├── Grilled Salmon
│   ├── Fish Tacos
│   └── Shrimp Scampi
├── Grilled Dishes (Subcategory)
│   ├── Ribeye Steak
│   └── Grilled Chicken
└── Vegetarian (Subcategory)
    ├── Veggie Burger
    └── Portobello Stack
```

### Managing Primary Categories

Primary categories appear in the left sidebar navigation.

**To Add a Primary Category:**
1. Go to Menu Management
2. Tap **[+ Add Category]** in the Primary section
3. Enter:
   - Name (Spanish): "Entradas"
   - Name (English): "Entrees"
   - Icon: 🍽️
   - Display Order: 2
4. Save

**To Edit/Delete:**
- Tap the category to edit
- Use the delete button (⚠️ moves all items to "Uncategorized")

### Managing Subcategories

Subcategories group related items within a primary category.

**To Add a Subcategory:**
1. Select the parent Primary Category
2. Tap **[+ Add Subcategory]**
3. Enter:
   - Name (Spanish): "Del Mar Su Encanto"
   - Name (English): "From The Sea"
4. Save

### Managing Menu Items

**To Add a Menu Item:**
1. Tap **[+ Add Item]**
2. Fill in the form:

| Field | Description | Example |
|-------|-------------|---------|
| Name | Spanish name | "Ceviche Mixto" |
| Name (EN) | English name | "Mixed Ceviche" |
| Description | Spanish description | "Pescado y mariscos frescos..." |
| Description (EN) | English description | "Fresh fish and seafood..." |
| Price | Base price | $18.99 |
| Cost | Your cost (for analytics) | $6.50 |
| Primary Category | Top-level category | Appetizers |
| Subcategory | Specific group | Ceviches |
| Image | Photo URL | https://... |
| Dietary Tags | Restrictions | 🌱 Vegetarian, 🌾 Gluten-Free |

**To 86 an Item:**
1. Find the item in the list
2. Toggle **"86'd"** switch ON
3. Optionally add reason: "Out of shrimp"
4. Item appears grayed out on POS and online ordering

### Managing Modifiers

**To Create a Modifier Group:**
1. Go to Modifier Groups section
2. Tap **[+ Add Group]**
3. Configure:

| Setting | Description |
|---------|-------------|
| Name | "Spice Level" |
| Required | Yes/No - must customer choose? |
| Multi-Select | Can select multiple options? |
| Min Selections | Minimum choices (0 for optional) |
| Max Selections | Maximum choices (null for unlimited) |

**To Add Modifiers to a Group:**
1. Open the modifier group
2. Tap **[+ Add Modifier]**
3. Enter:
   - Name: "Extra Hot"
   - Price Adjustment: +$0.00 (or +$1.50 for upcharges)
   - Is Default: Yes/No

**To Link Modifiers to Menu Items:**
1. Edit the menu item
2. In "Modifier Groups" section, select applicable groups
3. Save

---

## Order Lifecycle

### Complete Order Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORDER LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CUSTOMER                    POS                      KITCHEN           │
│                                                                          │
│   Places Order ──────────→ Creates Order ─────────→ Sees on KDS         │
│                            (pending)                 (NEW column)        │
│                                                           │              │
│                                                           ▼              │
│                                                    Taps [CONFIRM]        │
│                                                    (confirmed)           │
│                                                           │              │
│                                                           ▼              │
│                                                    Taps [START]          │
│                                                    (preparing)           │
│                                                    COOKING column        │
│                                                           │              │
│                                                           ▼              │
│                                                    Taps [DONE]           │
│                                                    (ready)               │
│                                                    READY column          │
│                                                           │              │
│                                                           ▼              │
│   Receives Food ◄──────── Server/Customer ◄─────── Taps [COMPLETE]      │
│                            picks up                 (completed)          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Order Statuses Explained

| Status | Meaning | Where Visible | Timestamp Captured |
|--------|---------|---------------|-------------------|
| `pending` | Order just created | KDS: NEW | `createdAt` |
| `confirmed` | Kitchen acknowledged | KDS: NEW | `confirmedAt` |
| `preparing` | Actively cooking | KDS: COOKING | `preparingAt` |
| `ready` | Food is up | KDS: READY | `readyAt` |
| `completed` | Delivered to customer | Order History | `completedAt` |
| `cancelled` | Order cancelled | Order History | `cancelledAt` |

### Cancellation Rules

Orders can be cancelled at any stage except `completed`:

| Current Status | Can Cancel? | Who Can Cancel |
|----------------|-------------|----------------|
| pending | ✅ Yes | Customer, Restaurant, System |
| confirmed | ✅ Yes | Restaurant, System |
| preparing | ✅ Yes (with reason) | Restaurant only |
| ready | ✅ Yes (with reason) | Restaurant only |
| completed | ❌ No | — |

When cancelling, a reason is required:
- "Customer changed mind"
- "Item 86'd"
- "Kitchen error"
- etc.

### Order Types

| Type | Use Case | Required Info |
|------|----------|---------------|
| **Dine-In** | Eating at restaurant | Table number |
| **Pickup** | Customer will collect | Customer name, phone |
| **Delivery** | Delivered to customer | Address, phone |

### Timing Analytics

OrderStack tracks timing at each stage for analytics:

| Metric | Calculation | Why It Matters |
|--------|-------------|----------------|
| **Time to Acknowledge** | `confirmedAt - createdAt` | How fast kitchen sees orders |
| **Prep Duration** | `readyAt - preparingAt` | Actual cooking time |
| **Window Time** | `completedAt - readyAt` | How long food sits waiting |
| **Total Ticket Time** | `completedAt - createdAt` | Customer wait time |

---

## Reports & Analytics

*🔜 Coming Soon*

### Planned Reports

| Report | Description |
|--------|-------------|
| **Daily Sales** | Total revenue, order count, average ticket |
| **Item Mix** | What's selling, quantities, percentages |
| **Food Cost** | Cost vs price, margin by item |
| **Kitchen Performance** | Avg ticket times, by station |
| **Peak Hours** | Busiest times by day/hour |

### AI Insights

OrderStack will provide intelligent recommendations:

> "Your food cost spiked 3% this week. Salmon prices increased 18%. Consider adjusting the Grilled Salmon price from $24 to $27."

> "Tuesdays are historically slow. Consider cutting one server shift."

> "Lomo Saltado is your most popular item but has low margin. Add a suggested upsell prompt for Chicha Morada (+$4)."

---

## Troubleshooting

### Common Issues

#### KDS Not Showing New Orders

1. **Check connection indicator** - Should show ● Live
2. **Refresh the page** - Pull down or tap 🔄
3. **Verify restaurant ID** - Make sure correct restaurant is selected
4. **Check backend status** - API might be sleeping (free tier)

#### POS Won't Process Payment

1. **Check internet connection**
2. **Verify Stripe is configured** in restaurant settings
3. **Try a different payment method** (cash) to complete order
4. **Contact support** if issue persists

#### Orders Stuck in Wrong Status

1. **Check KDS** - Has kitchen bumped the order?
2. **Use Order History** to manually update status
3. **Cancel and recreate** if order is hopelessly stuck

#### Menu Items Not Appearing

1. **Check if item is 86'd** - Look for gray/disabled state
2. **Verify category assignment** - Item needs both primary and subcategory
3. **Check "Available" toggle** - Must be ON
4. **Clear cache** - Pull down to refresh menu

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Failed to fetch orders" | Can't reach backend | Check internet, try again |
| "Invalid status transition" | Trying to skip a step | Follow proper order flow |
| "Payment failed" | Stripe error | Check card, try again |
| "Item not found" | Menu data out of sync | Refresh menu |

### Getting Help

- **Email**: support@getorderstack.com
- **Documentation**: docs.getorderstack.com
- **Status Page**: status.getorderstack.com

---

## Glossary

| Term | Definition |
|------|------------|
| **86'd** | Industry slang for "out of stock" - item unavailable |
| **Bump** | Move an order to the next status stage |
| **Cover** | One guest (used for capacity planning) |
| **Expo** | Expeditor - person who coordinates food going out |
| **FIFO** | First In, First Out - serve oldest orders first |
| **KDS** | Kitchen Display System |
| **Modifier** | Option that customizes a menu item |
| **POS** | Point of Sale - where orders are entered |
| **Ticket** | An order (from paper ticket days) |
| **Window** | The pass/counter where food waits for pickup |

---

## Appendix A: Keyboard Shortcuts

*Coming soon for web version*

## Appendix B: API Reference

For developers and integrations, see: `docs/API_REFERENCE.md`

## Appendix C: Recommended Hardware

| Use Case | Recommended Device | Notes |
|----------|-------------------|-------|
| POS (Budget) | Samsung Galaxy Tab A8 | $180, 10.5" |
| POS (Premium) | iPad 10th Gen | $449, 10.9" |
| KDS | Amazon Fire HD 10 | $150, good for kitchen |
| Receipt Printer | Star TSP143III | $300, reliable |
| Card Reader | Stripe Reader M2 | $59, tap/chip/swipe |

---

*© 2026 OrderStack. Built with ❤️ for independent restaurants.*
