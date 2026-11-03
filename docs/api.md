# Internal Store & Service Layer Documentation

This document specifies the internal domain models, state stores, and service layer contracts for the Lay's Crunch Experience application.

---

## 1. Flavor Service (`domain/flavorService.js`)

Manages flavor definitions, metadata, colors, and 3D bag asset mappings.

### Endpoints / Methods:

#### `getFlavors()`
- **Returns:** `Flavor[]`
- **Description:** Returns the complete list of 9 Lay's flavors with their design tokens, taste descriptions, and chapter highlights.

#### `getFlavorById(id: string)`
- **Parameters:** `id` (e.g. `'flamin-hot'`)
- **Returns:** `Flavor | undefined`

#### `getFlavorTheme(id: string)`
- **Parameters:** `id`
- **Returns:** `{ color: string, deep: string, glow: string, ink: string }`

---

## 2. E-Commerce Cart & Ordering Store (`domain/cartStore.js`)

Manages customer cart state, ₹ currency conversions, 3-pack bundle logic, delivery checkout, and order persistence.

### Pricing Structure:
- **Single Flavor Packet:** ₹20.00 (`BASE_SINGLE_PRICE = 20`)
- **Build-A-Box 3-Pack Bundle:** ₹50.00 (`BOX_BUNDLE_PRICE = 50`, Regular ₹60.00, Discount ₹10.00)
- **Delivery Fee:** FREE promotion across all orders

### State Contract:
```typescript
interface CustomerDetails {
  name: string;
  phone: string; // 10-digit mobile
  email: string;
  location: string; // Delivery address or GPS coordinates
  message?: string; // Special delivery instructions
}

interface OrderRecord {
  orderId: string; // e.g. "LAYS-849201"
  date: string; // en-IN timestamp
  customer: CustomerDetails;
  items: { [flavorId: string]: number };
  bundles: string[][]; // Array of 3-flavor ID tuples
  totalItems: number;
  subtotal: number;
  deliveryFee: number; // 0
  grandTotal: number;
  currency: '₹';
  status: 'Confirmed' | 'Packaging' | 'OutForDelivery' | 'Delivered';
}

interface CartState {
  items: { [flavorId: string]: number };
  slots: (string | null)[]; // Max 3 items for Build-A-Box tray
  bundles: string[][];
  isCartOpen: boolean;
  totalCount: number;
  activeOrder: OrderRecord | null;
}
```

### Methods:

#### `addItem(flavorId: string, quantity: number = 1): void`
Adds or updates the quantity of individual ₹20 flavor packets.

#### `addFlavorToSlot(flavorId: string): boolean`
Places a flavor into the next available slot (0-2) in the Build-A-Box 3-pack tray.

#### `removeSlot(slotIndex: number): void`
Removes a flavor from a specific slot in the 3-pack tray.

#### `clearSlots(): void`
Resets the active 3-pack tray slots.

#### `addBoxToCart(): boolean`
Locks the 3-pack tray into a saver bundle at ₹50 (regular ₹60) and clears the tray for another box.

#### `removeBundle(bundleIndex: number): void`
Removes a saved 3-pack bundle from the cart.

#### `placeOrder(customerData: CustomerDetails): OrderRecord | null`
- **Request:** Customer details `{ name, phone, email, location, message }`.
- **Response:** Complete `OrderRecord` with generated Order ID, items, delivery details, and ₹ totals.
- **Side Effects:** Saves order to `localStorage['lays_orders']`, resets active cart, and notifies subscribers.
- **Error Handling:** Returns `null` if the basket is empty or required customer fields are missing.

#### `getOrders(): OrderRecord[]`
Returns list of persisted past orders from `localStorage`.

#### `openCart(): void` / `closeCart(): void`
Toggles visibility of the E-Commerce slide-out checkout drawer.

---

## 3. Audio Synth Service (`services/audioService.js`)

Synthesizes tactile sound effects (crunch, bag rustle, click, whoosh) using Web Audio API without needing external sound file dependencies.

### Methods:
- `initAudio(): Promise<void>`
- `toggleMute(): boolean`
- `playCrunch(intensity?: number): void`
- `playRustle(): void`
- `playClick(): void`
- `playWhoosh(): void`

---

## 4. Texture & Chroma-Key Service (`services/textureService.js`)

Handles texture preloading, transparent bag generation using chroma-key pixel masking, and Three.js material bindings.

### Methods:
- `loadPackTextures(flavors: Flavor[]): Promise<void>`
- `getPackTexture(flavor: Flavor): THREE.Texture | null`
- `getPackImageSrc(flavor: Flavor): string`
