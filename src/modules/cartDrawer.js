import { cartStore } from '../domain/cartStore.js';
import { getFlavorById } from '../domain/flavors.js';
import { audioService } from '../services/audioService.js';

/**
 * Cart Drawer & Checkout Experience
 */

export class CartDrawer {
  constructor() {
    this.drawerEl = document.getElementById('cart-drawer');
    this.overlayEl = document.getElementById('cart-overlay');
    this.closeBtn = document.getElementById('cart-close-btn');
    this.cartItemsContainer = document.getElementById('cart-items-list');
    this.cartSubtotalEl = document.getElementById('cart-subtotal');
    this.checkoutBtn = document.getElementById('cart-checkout-btn');
    this.navCartPill = document.getElementById('nav-cart-pill');
    this.navCartCount = document.getElementById('nav-cart-count');

    this.init();
  }

  init() {
    // Subscribe to cart store
    cartStore.subscribe((state) => {
      this.updateUI(state);
    });

    if (this.navCartPill) {
      this.navCartPill.addEventListener('click', () => {
        audioService.playClick();
        cartStore.toggleCart();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        audioService.playClick();
        cartStore.closeCart();
      });
    }

    if (this.overlayEl) {
      this.overlayEl.addEventListener('click', () => {
        cartStore.closeCart();
      });
    }

    if (this.checkoutBtn) {
      this.checkoutBtn.addEventListener('click', () => {
        audioService.playCrunch(0.7);
        alert('🎉 Concept Store Order Submitted! Thank you for crunching with Lay\'s Crunch Experience.');
        cartStore.clearSlots();
        cartStore.closeCart();
      });
    }
  }

  updateUI(state) {
    // 1. Update nav counter
    if (this.navCartCount) {
      const count = state.totalCount + state.filledSlotsCount;
      const formatted = String(count).padStart(3, '0');
      this.navCartCount.textContent = formatted;
    }

    // 2. Open / Close drawer
    if (this.drawerEl && this.overlayEl) {
      this.drawerEl.classList.toggle('open', state.isCartOpen);
      this.overlayEl.classList.toggle('open', state.isCartOpen);
    }

    // 3. Render items list
    if (!this.cartItemsContainer) return;
    this.cartItemsContainer.innerHTML = '';

    let subtotal = 0;

    // Render individual items
    const itemEntries = Object.entries(state.items);
    if (itemEntries.length === 0 && state.filledSlotsCount === 0) {
      this.cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <p>Your basket is currently empty.</p>
          <span>Grab a bag from the wall or build a custom 3-pack!</span>
        </div>
      `;
      if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = '$0.00';
      return;
    }

    // If box has slots in progress
    if (state.filledSlotsCount > 0) {
      const boxCard = document.createElement('div');
      boxCard.className = 'cart-item-row';
      const slotNames = state.slots
        .filter(Boolean)
        .map(id => getFlavorById(id).name)
        .join(', ');

      const isBundle = state.filledSlotsCount === 3;
      const price = isBundle ? state.boxFinalPrice : state.filledSlotsCount * state.singlePrice;
      subtotal += price;

      boxCard.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-title">Custom 3-Pack Box ${isBundle ? '(BUNDLE SAVE $1.49)' : ''}</div>
          <div class="cart-item-subtitle">${slotNames}</div>
        </div>
        <div class="cart-item-price">$${price.toFixed(2)}</div>
      `;
      this.cartItemsContainer.appendChild(boxCard);
    }

    // Individual bags
    itemEntries.forEach(([flavorId, qty]) => {
      const flavor = getFlavorById(flavorId);
      const itemPrice = qty * state.singlePrice;
      subtotal += itemPrice;

      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item-row';
      itemRow.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-title">${flavor.name} (x${qty})</div>
          <div class="cart-item-subtitle">${flavor.subtitle}</div>
        </div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn" data-action="minus" data-id="${flavorId}">-</button>
          <span>${qty}</span>
          <button class="cart-qty-btn" data-action="plus" data-id="${flavorId}">+</button>
          <div class="cart-item-price">$${itemPrice.toFixed(2)}</div>
        </div>
      `;

      itemRow.querySelector('[data-action="minus"]').addEventListener('click', () => {
        cartStore.addItem(flavorId, -1);
      });
      itemRow.querySelector('[data-action="plus"]').addEventListener('click', () => {
        cartStore.addItem(flavorId, 1);
      });

      this.cartItemsContainer.appendChild(itemRow);
    });

    if (this.cartSubtotalEl) {
      this.cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    }
  }
}

