/**
 * Domain Cart & Build-A-Box Store
 * Manages item counts, 3-pack custom slots, bundle discounts (₹),
 * and customer order placement.
 */

const MAX_BOX_SLOTS = 3;
export const BASE_SINGLE_PRICE = 20; // ₹20 per packet
export const BOX_BASE_TOTAL = 60;    // 3 x ₹20
export const BOX_DISCOUNT = 10;     // Save ₹10
export const BOX_BUNDLE_PRICE = 50;  // ₹50 for 3-pack

class CartStore {
  constructor() {
    this.state = {
      slots: [null, null, null], // array of 3 flavor IDs or null
      items: {}, // flavorId -> quantity of loose bags
      bundles: [], // Array of bundles: [ [flavor1, flavor2, flavor3], ... ]
      isCartOpen: false,
      lastAdded: null,
      totalCount: 0,
      activeOrder: null
    };
    this.listeners = new Set();
    this.loadOrders();
  }

  loadOrders() {
    try {
      const saved = localStorage.getItem('lays_orders');
      this.orders = saved ? JSON.parse(saved) : [];
    } catch (_) {
      this.orders = [];
    }
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
    const looseTotal = Object.entries(this.state.items).reduce((acc, [_, q]) => acc + q * BASE_SINGLE_PRICE, 0);
    const bundlesTotal = this.state.bundles.length * BOX_BUNDLE_PRICE;
    const subtotal = looseTotal + bundlesTotal;

    return {
      ...this.state,
      slots: [...this.state.slots],
      items: { ...this.state.items },
      bundles: [...this.state.bundles],
      isBoxComplete: this.state.slots.every(s => s !== null),
      filledSlotsCount: this.state.slots.filter(s => s !== null).length,
      boxBasePrice: BOX_BASE_TOTAL,
      boxDiscount: BOX_DISCOUNT,
      boxFinalPrice: BOX_BUNDLE_PRICE,
      singlePrice: BASE_SINGLE_PRICE,
      subtotal,
      currencySymbol: '₹',
      currencyPrefix: '₹'
    };
  }

  addFlavorToSlot(flavorId) {
    const emptyIndex = this.state.slots.findIndex(s => s === null);
    if (emptyIndex !== -1) {
      this.state.slots[emptyIndex] = flavorId;
      this.state.lastAdded = flavorId;
      this.syncTotal();
      this.notify();
      return true;
    }
    // If all full, replace slot 2
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
    // Add current 3-pack as a bundle with discount ₹50
    const filled = this.state.slots.filter(Boolean);
    if (filled.length === 3) {
      this.state.bundles.push([...this.state.slots]);
      this.clearSlots();
    } else {
      // Loose items if not a full 3-pack
      filled.forEach(id => this.addItem(id, 1));
      this.clearSlots();
    }
    this.openCart();
  }

  removeBundle(bundleIdx) {
    if (bundleIdx >= 0 && bundleIdx < this.state.bundles.length) {
      this.state.bundles.splice(bundleIdx, 1);
      this.syncTotal();
      this.notify();
    }
  }

  syncTotal() {
    let count = 0;
    Object.values(this.state.items).forEach(q => (count += q));
    count += this.state.bundles.length * 3;
    count += this.state.slots.filter(Boolean).length;
    this.state.totalCount = count;
  }

  placeOrder(customerData) {
    // If there are in-progress slots in the tray, convert them to loose items
    this.state.slots.filter(Boolean).forEach(id => {
      this.state.items[id] = (this.state.items[id] || 0) + 1;
    });
    this.state.slots = [null, null, null];
    this.syncTotal();

    const state = this.getState();
    if (state.totalCount === 0) return null;

    const orderId = `LAYS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      orderId,
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      customer: {
        name: customerData.name || 'Crunch Lover',
        phone: customerData.phone || '',
        email: customerData.email || '',
        location: customerData.location || '',
        message: customerData.message || ''
      },
      items: { ...this.state.items },
      bundles: [...this.state.bundles],
      totalItems: state.totalCount,
      subtotal: state.subtotal,
      deliveryFee: 0, // Free Delivery promotion!
      grandTotal: state.subtotal,
      currency: '₹',
      status: 'Confirmed'
    };

    this.orders.unshift(newOrder);
    try {
      localStorage.setItem('lays_orders', JSON.stringify(this.orders));
    } catch (_) {}

    // Clear cart after placing order
    this.state.items = {};
    this.state.bundles = [];
    this.state.slots = [null, null, null];
    this.state.totalCount = 0;
    this.state.activeOrder = newOrder;
    this.notify();

    return newOrder;
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
