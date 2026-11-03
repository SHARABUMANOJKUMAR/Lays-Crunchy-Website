/**
 * Domain Cart & Build-A-Box Store
 * Manages item counts, 3-pack custom slots, and reactive listeners.
 */

const MAX_BOX_SLOTS = 3;
const BASE_SINGLE_PRICE = 2.49;
const BOX_BASE_TOTAL = 7.47;
const BOX_DISCOUNT = 1.49;
const BOX_BUNDLE_PRICE = 5.98;

class CartStore {
  constructor() {
    this.state = {
      slots: [null, null, null], // array of 3 flavor IDs or null
      items: {}, // flavorId -> quantity
      isCartOpen: false,
      isBuildBoxOpen: false,
      lastAdded: null,
      totalCount: 0
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach(fn => fn(currentState));
  }

  getState() {
    return {
      ...this.state,
      slots: [...this.state.slots],
      items: { ...this.state.items },
      isBoxComplete: this.state.slots.every(s => s !== null),
      filledSlotsCount: this.state.slots.filter(s => s !== null).length,
      boxBasePrice: BOX_BASE_TOTAL,
      boxDiscount: BOX_DISCOUNT,
      boxFinalPrice: BOX_BUNDLE_PRICE,
      singlePrice: BASE_SINGLE_PRICE
    };
  }

  addFlavorToSlot(flavorId) {
    // Find first empty slot
    const emptyIndex = this.state.slots.findIndex(s => s === null);
    if (emptyIndex !== -1) {
      this.state.slots[emptyIndex] = flavorId;
      this.state.lastAdded = flavorId;
      this.syncTotal();
      this.notify();
      return true;
    }
    // If all full, replace the last slot
    this.state.slots[2] = flavorId;
    this.state.lastAdded = flavorId;
    this.syncTotal();
    this.notify();
    return true;
  }

  removeSlot(index) {
    if (index >= 0 && index < MAX_BOX_SLOTS) {
      this.state.slots[index] = null;
      this.syncTotal();
      this.notify();
    }
  }

  clearSlots() {
    this.state.slots = [null, null, null];
    this.syncTotal();
    this.notify();
  }

  addItem(flavorId, qty = 1) {
    const current = this.state.items[flavorId] || 0;
    this.state.items[flavorId] = Math.max(0, current + qty);
    if (this.state.items[flavorId] === 0) {
      delete this.state.items[flavorId];
    }
    this.syncTotal();
    this.notify();
  }

  addBoxToCart() {
    // Adds currently filled slots as a bundle
    this.state.slots.forEach(id => {
      if (id) {
        this.addItem(id, 1);
      }
    });
    this.clearSlots();
    this.openCart();
  }

  syncTotal() {
    let count = 0;
    Object.values(this.state.items).forEach(q => (count += q));
    this.state.totalCount = count;
  }

  openCart() {
    this.state.isCartOpen = true;
    this.notify();
  }

  closeCart() {
    this.state.isCartOpen = false;
    this.notify();
  }

  toggleCart() {
    this.state.isCartOpen = !this.state.isCartOpen;
    this.notify();
  }
}

export const cartStore = new CartStore();

