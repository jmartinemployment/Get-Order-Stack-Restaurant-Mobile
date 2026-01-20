# Get-Order-Stack-Restaurant-Mobile

React Native monorepo for GetOrderStack restaurant staff applications (KDS, POS, etc.)

## Architecture

```
Get-Order-Stack-Restaurant-Mobile/
├── apps/
│   ├── kds/           ← Kitchen Display System
│   └── pos/           ← Point of Sale (coming soon)
├── packages/
│   ├── ui/            ← Shared React Native components
│   ├── api/           ← Shared API client & WebSocket hooks
│   └── models/        ← Shared TypeScript types
└── package.json       ← Workspace root
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android emulator) or physical Android device
- Xcode (for iOS simulator, Mac only)

### Installation

```bash
cd Get-Order-Stack-Restaurant-Mobile
npm install
```

### Running the KDS App

```bash
# Start Expo development server
npm run kds

# Or run directly on Android
npm run kds:android
```

### Running on Physical Device

1. Install **Expo Go** app on your Android/iOS device
2. Run `npm run kds`
3. Scan the QR code with Expo Go

### Running on TV/External Monitor

1. Connect Android tablet via USB or use emulator
2. Drag emulator window to external monitor
3. Set landscape orientation in app.json (already configured)

## Apps

### KDS (Kitchen Display System)

Three-column Kanban-style display:
- **NEW** - Incoming orders (tap START to begin)
- **COOKING** - Orders being prepared (tap DONE when ready)
- **READY** - Orders waiting for pickup/delivery (tap BUMP to complete)

Features:
- Real-time order updates via WebSocket
- Elapsed time tracking with urgent highlighting (>10 min)
- Order type badges (Pickup/Delivery/Dine-in)
- Special instructions highlighted
- Audio alerts for new orders (coming soon)

### POS (Point of Sale)

Coming soon - order entry, payments, etc.

## Shared Packages

### @get-order-stack/models

TypeScript interfaces matching backend Prisma models:
- Order, OrderItem, OrderStatus
- MenuItem, MenuCategory
- Customer, Restaurant

### @get-order-stack/api

- `ordersApi` - REST API client for orders
- `orderWebSocket` - Real-time order updates
- `setApiBaseUrl()` - Configure API endpoint

### @get-order-stack/ui

Shared React Native components:
- `OrderCard` - Displays order with items and bump button
- `StatusBadge` - Order status indicator
- `theme` - Colors, spacing, typography constants

## Deployment

### Building APK for Direct Install

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (first time only)
eas build:configure

# Build APK
cd apps/kds
eas build --platform android --profile preview
```

### Installing on Restaurant Tablet

1. Enable "Install from Unknown Sources" on tablet
2. Download APK from EAS build or your server
3. Install and run
4. Configure API URL in app settings

## API Connection

The KDS app connects to:
- **REST API**: `Get-Order-Stack-Restaurant-Backend` for order operations
- **WebSocket**: Real-time order updates (requires backend WebSocket support)

Configure the API URL in `apps/kds/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://your-server:3000/api/restaurant"
    }
  }
}
```

## Related Projects

- `Get-Order-Stack-Restaurant-Frontend` - Angular customer ordering widgets
- `Get-Order-Stack-Restaurant-Backend` - Node.js/Express API
