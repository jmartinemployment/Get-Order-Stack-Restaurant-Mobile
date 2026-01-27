# Get-Order-Stack Restaurant Mobile - Handoff Document

## Repository
**GitHub:** https://github.com/jmartinemployment/Get-Order-Stack-Restaurant-Mobile

## Project Overview
React Native monorepo containing two tablet applications for restaurant operations:
- **POS (Point of Sale)** - Order taking and checkout for front-of-house staff
- **KDS (Kitchen Display System)** - Order management for kitchen staff

## Current Status: ✅ DEPLOYED TO PRODUCTION

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

## 🆕 Latest Updates (January 23, 2026)

### Menu Item Management Screen Updates ✅ COMPLETE

**Header Layout:**
- Close button is just "✕" (no text)
- Add Item button below Close button (vertical stack)

**Item List Display:**
- Single name display (respects language toggle - no duplicate names)
- Dietary tags now bilingual (🥬 Vegetariano vs 🥬 Vegetarian based on language)
- Subcategory shown in pink text under item name

**Edit Menu Item Modal - Two-Tier Category Selection:**
- **Primary Category picker** - Shows all primary categories with icons (horizontal scroll)
- **Subcategory picker** - Shows only subcategories belonging to selected primary (wrapping pills)
- When primary changes, subcategory auto-selects first available
- Subcategory pills use `flexWrap` to prevent truncation

**New Header Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 🍽️ Menu Item Management                      [✕]  │
│                                          [+ Add Item] │
└─────────────────────────────────────────────────────┘
```

### MenuScreen UI Redesign ✅ COMPLETE

**Ribbon Headers Replace Subcategory Pills:**
- Subcategories display as inline ribbon headers within scrollable menu
- Format: `══ CEVICHES ══════════════` (red accent, uppercase)

**UpsellBar Component:**
- AI-powered suggestion bar with three modes: empty-cart, has-items, checkout
- Color-coded suggestion types (Chef Pick, Popular, High Margin, Upsell)

**Chef Input Panel:**
- `👨‍🍳 Chef` button in header opens panel for daily specials

---

## 🔴 PRIORITY: Next Items To Do

### 1. **Database Cleanup: Remove Redundant "Appetizers" Subcategory**
- Subcategory "Para Empezar a Enamorarte" (nameEn: "Appetizers") is redundant
- ID: `d5799042-64f0-47ac-9dbd-2c9b93550297`
- **12 menu items** currently assigned need reassignment first
- Items like "Veggie Saltado" are actually entrees, not appetizers
- Likely should move to Entrees → "Veggie Lovers" or "Wok Me Up"

**To list the 12 items:**
```bash
curl -s "https://get-order-stack-restaurant-backend.onrender.com/api/restaurant/f2cfe8dd-48f3-4596-ab1e-22a28b23ad38/menu/items" | grep -B5 '"categoryId":"d5799042-64f0-47ac-9dbd-2c9b93550297"'
```

### 2. **HIGH: Connect UpsellBar to Real AI Backend**
Create endpoint: `GET /api/restaurant/:id/upsell-suggestions?cartItems=...`

### 3. **HIGH: Persist Chef Picks to Backend**
Create endpoints for chef picks CRUD

### 4. **MEDIUM: Checkout Mode for UpsellBar**
Implement `mode="checkout"` display in CheckoutModal

---

## Architecture

```
Get-Order-Stack-Restaurant-Mobile/
├── apps/
│   ├── pos/                    # Point of Sale App
│   │   └── src/
│   │       ├── components/
│   │       │   ├── CheckoutModal.tsx
│   │       │   ├── ReceiptPrinter.tsx
│   │       │   ├── PrimaryCategoryNav.tsx
│   │       │   ├── UpsellBar.tsx
│   │       │   └── ChefInputPanel.tsx
│   │       ├── context/
│   │       │   ├── CartContext.tsx
│   │       │   └── RestaurantContext.tsx
│   │       └── screens/
│   │           ├── MenuScreen.tsx
│   │           ├── OrderHistoryScreen.tsx
│   │           ├── RestaurantSetupScreen.tsx
│   │           ├── CategoryManagementScreen.tsx
│   │           └── MenuItemManagementScreen.tsx  # Two-tier category pickers
│   │
│   └── kds/                    # Kitchen Display System
│       └── src/
│           └── screens/
│               └── KitchenDisplayScreen.tsx
│
├── packages/                   # Shared packages (future)
└── docs/                       # Documentation
```

---

## Key File: MenuItemManagementScreen.tsx

**Location:** `/apps/pos/src/screens/MenuItemManagementScreen.tsx`

**Key Features:**
- `formData.primaryCategoryId` - Tracks selected primary category
- `formData.categoryId` - Tracks selected subcategory
- `handlePrimaryCategoryChange()` - Updates primary and resets subcategory
- `filteredSubcategoriesForForm` - Subcategories filtered by selected primary
- `subcategoryToPrimaryMap` - Maps subcategory IDs to primary category IDs

**Styles:**
- `categoryPicker` - Horizontal scroll for primary categories
- `categoryPickerWrap` - Wrapping layout for subcategories

---

## Database Category Structure (Taipa Restaurant)

**Primary Categories:**
| Name | Slug | Icon | Subcategory Count |
|------|------|------|-------------------|
| Aperitivos | appetizers | 🥗 | 3 |
| Entradas | entrees | 🍽️ | 5 |
| Bebidas | beverages | 🥤 | 4 |
| Postres | desserts | 🍰 | 0 |
| Acompañamientos | sides | 🥕 | 0 |

**Subcategories under Appetizers (needs cleanup):**
- ❌ "Para Empezar a Enamorarte" / "Appetizers" - REDUNDANT, 12 items need reassignment
- ✅ "In Ceviche We Trust" / "Ceviches"
- ✅ "Sopas" / "Soups"

**Subcategories under Entrees:**
- "Del Mar Su Encanto" / "From The Sea"
- "Ásame a la parrilla" / "Grilled Dishes"
- "Wok Me Up" / "Stir Fried"
- "Saving The Tradition" / "Traditional Peruvian"
- "Veggie Lovers" / "Veggie Lovers"

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

### Running on iPhone (Expo Go)

**Prerequisites:**
- Install "Expo Go" from App Store (developer: Nametag, version 54+)
- First time may prompt to install `@expo/ngrok` - say yes

**Start tunnel server:**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile
npm run pos:phone
```

**Connect your phone:**
1. Wait for terminal to show `exp://xxxxx.exp.direct` URL
2. Open iPhone Camera and scan the QR code in terminal
3. Tap the banner to open in Expo Go
4. App hot-reloads as you make changes

**Note:** Keep the tunnel server running while developing. Expo Go will reconnect automatically if you reopen it.

### Building Standalone Apps (No Computer Needed)

**Prerequisites:**
```bash
npm install -g eas-cli
eas login  # Create free Expo account if needed
```

**Android APK (Free):**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile/apps/pos
npx eas build --platform android --profile preview
```
- Build takes ~10-15 minutes on Expo's servers
- Download .apk from the link provided
- Transfer to phone, tap to install
- Android will warn about "unknown sources" - approve it
- App is installed permanently - no Expo Go or computer needed

**iOS (Requires $99/year Apple Developer Account):**
```bash
cd /Users/jam/development/Get-Order-Stack-Restaurant-Mobile/apps/pos
npx eas build --platform ios --profile preview
```
- Must have Apple Developer account
- Limited to 100 registered test devices
- For public distribution, must submit to App Store

**Web App (Free, Works Everywhere):**
- Already deployed: https://get-order-stack-restaurant-mobile.vercel.app
- On any device: Open URL → Add to Home Screen
- No install needed, works on iPhone, Android, tablets

---

## 🔧 Current Issues To Fix

### Screen Orientation
- App should lock to landscape mode on mobile devices
- Currently not enforcing orientation properly

---

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
| `/menu/grouped` | GET | Hierarchical menu |
| `/primary-categories` | GET/POST | Primary categories |
| `/menu/categories` | GET/POST | Subcategories |
| `/menu/items` | GET/POST | Menu items |
| `/menu/items/:id` | PATCH/DELETE | Update/delete item |
| `/orders` | GET/POST | Orders |
| `/orders/:id/profit-insight` | GET | Profit analysis |

---

## Known Issues / Tech Debt

1. **Redundant subcategory** - "Appetizers" subcategory under "Appetizers" primary needs deletion
2. **12 misclassified items** - Need reassignment before subcategory deletion
3. **UpsellBar** uses demo data - needs real AI backend
4. **Chef Picks** not persisted - in-memory only
5. **No offline support**
6. **No sound notifications** on KDS

---

## Session Transcript
Previous conversation transcript available at:
`/mnt/transcripts/2026-01-23-10-28-56-menu-item-management-ui-changes.txt`

---

*Last Updated: January 23, 2026*
