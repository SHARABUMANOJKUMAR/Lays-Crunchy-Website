# Internal Store & Service Layer Documentation

This document specifies the internal domain models, state stores, and service layer contracts for the Lay's Crunch Experience application.

---

## 1. Flavor Service (`domain/flavorService.js`)

Manages flavor definitions, metadata, colors, and 3D bag asset mappings.

### Endpoints / Methods:

#### `getFlavors()`
- **Returns:** `Flavor[]`
- Description: Returns the list of all available Lay's flavors with their design tokens, taste descriptions, and chapter highlights.

#### `getFlavorById(id: string)`
- **Parameters:** `id` (e.g. `'flamin-hot'`)
- **Returns:** `Flavor | undefined`

#### `getFlavorTheme(id: string)`
- **Parameters:** `id`
- **Returns:** `{ color: string, deep: string, glow: string, ink: string }`

---

## 2. Cart & Build-A-Box Store (`domain/cartStore.js`)

Manages customer cart state, 3-pack bundle logic, and drawer actions.

### State Contract:
```typescript
interface CartState {
  items: { [flavorId: string]: number };
  boxSlots: (string | null)[]; // Max 3 items for Build-A-Box
  isDrawerOpen: boolean;
  boxDiscount: number; // 1.49
  baseBoxPrice: number; // 7.47
  finalBoxPrice: number; // 5.98
}
```

### Methods:
- `addSlotFlavor(flavorId: string): boolean`
- `removeSlotFlavor(slotIndex: number): void`
- `clearBox(): void`
- `getTotalItemCount(): number`
- `subscribe(listener: (state: CartState) => void): () => void`

---

## 3. Audio Synth Service (`services/audioService.js`)

Synthesizes tactile sound effects (crunch, bag rustle, click, whoosh) using Web Audio API without needing external sound file dependencies.

### Methods:
- `initAudio(): Promise<void>`
- `toggleMute(): boolean`
- `playCrunch(): void`
- `playRustle(): void`
- `playClick(): void`
- `playWhoosh(): void`

