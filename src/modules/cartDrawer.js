import { cartStore, BASE_SINGLE_PRICE, BOX_BUNDLE_PRICE } from '../domain/cartStore.js';
import { getFlavorById } from '../domain/flavors.js';
import { audioService } from '../services/audioService.js';
import { textureService } from '../services/textureService.js';

/**
 * E-Commerce Cart & Ordering Checkout Module
 * Handles itemized cart rendering in Rupees (₹20/bag, ₹50/3-pack),
 * customer ordering form with location detection, validation,
 * and live delivery tracking modal.
 */

export class CartDrawer {
  constructor() {
    this.drawerEl = document.getElementById('cart-drawer');
    this.overlayEl = document.getElementById('cart-overlay');
    this.closeBtn = document.getElementById('cart-close-btn');
    this.cartItemsContainer = document.getElementById('cart-items-list');
    this.cartSubtotalEl = document.getElementById('cart-subtotal');
    this.cartGrandTotalEl = document.getElementById('cart-grand-total');
    this.orderBtnAmountEl = document.getElementById('order-btn-amount');
    this.checkoutForm = document.getElementById('checkout-order-form');
    this.navCartPill = document.getElementById('nav-cart-pill');
    this.navCartCount = document.getElementById('nav-cart-count');
    this.btnDetectLocation = document.getElementById('btn-detect-location');

    // Success Modal elements
    this.successModal = document.getElementById('order-success-modal');
    this.modalOrderId = document.getElementById('modal-order-id');
    this.modalCustomerName = document.getElementById('modal-customer-name');
    this.modalCustomerPhone = document.getElementById('modal-customer-phone');
    this.modalCustomerLocation = document.getElementById('modal-customer-location');
    this.modalOrderTotal = document.getElementById('modal-order-total');
    this.btnCloseSuccessModal = document.getElementById('btn-close-success-modal');
    this.btnPrintReceipt = document.getElementById('btn-print-receipt');

    this.init();
  }

  init() {
    // 1. Subscribe to cart state updates
    cartStore.subscribe((state) => {
      this.updateUI(state);
    });

    // 2. Open / Close triggers
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

    // 3. Location Auto-Detect
    if (this.btnDetectLocation) {
      this.btnDetectLocation.addEventListener('click', () => {
        this.detectLocation();
      });
    }

    // 4. Payment selection radio styling
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        paymentOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        audioService.playClick();
      });
    });

    // 5. Submit Order Form
    if (this.checkoutForm) {
      this.checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleOrderSubmission();
      });
    }

    // 6. Success Modal buttons
    if (this.btnCloseSuccessModal) {
      this.btnCloseSuccessModal.addEventListener('click', () => {
        audioService.playClick();
        if (this.successModal) this.successModal.classList.remove('open');
      });
    }

    if (this.btnPrintReceipt) {
      this.btnPrintReceipt.addEventListener('click', () => {
        window.print();
      });
    }
  }

  detectLocation() {
    const locInput = document.getElementById('order-location');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.btnDetectLocation.innerHTML = `<span>⏳ Detecting...</span>`;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (locInput) {
          locInput.value = `📍 GPS Coordinates: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Auto-detected location, Bangalore, India)`;
        }
        this.btnDetectLocation.innerHTML = `<span>✓ Location Set</span>`;
        audioService.playClick();
      },
      () => {
        // Fallback default city address simulation
        if (locInput) {
          locInput.value = `📍 Sector 4, HSR Layout, Bengaluru, Karnataka - 560102`;
        }
        this.btnDetectLocation.innerHTML = `<span>✓ Location Set</span>`;
      },
      { timeout: 7000 }
    );
  }

  handleOrderSubmission() {
    const state = cartStore.getState();
    if (state.totalCount === 0) {
      alert('Your basket is empty. Please add at least 1 flavor packet to place an order.');
      return;
    }

    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const email = document.getElementById('order-email').value.trim();
    const location = document.getElementById('order-location').value.trim();
    const message = document.getElementById('order-message').value.trim();

    if (!name || !phone || !email || !location) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Place the order
    const order = cartStore.placeOrder({ name, phone, email, location, message });
    if (!order) return;

    audioService.playCrunch(0.85);

    // Show Confirmation Modal
    if (this.modalOrderId) this.modalOrderId.textContent = `#${order.orderId}`;
    if (this.modalCustomerName) this.modalCustomerName.textContent = order.customer.name;
    if (this.modalCustomerPhone) this.modalCustomerPhone.textContent = `+91 ${order.customer.phone}`;
    if (this.modalCustomerLocation) this.modalCustomerLocation.textContent = order.customer.location;
    if (this.modalOrderTotal) this.modalOrderTotal.textContent = `₹${order.grandTotal.toFixed(2)} (Cash/UPI on Delivery)`;

    // Close drawer and open confirmation modal
    cartStore.closeCart();
    this.checkoutForm.reset();
    if (this.btnDetectLocation) {
      this.btnDetectLocation.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg> Auto-Detect`;
    }

    setTimeout(() => {
      if (this.successModal) this.successModal.classList.add('open');
    }, 250);
  }

  updateUI(state) {
    // 1. Update nav counter
    if (this.navCartCount) {
      const count = state.totalCount + state.filledSlotsCount;
      this.navCartCount.textContent = String(count).padStart(3, '0');
    }

    // 2. Open / Close drawer
    if (this.drawerEl && this.overlayEl) {
      this.drawerEl.classList.toggle('open', state.isCartOpen);
      this.overlayEl.classList.toggle('open', state.isCartOpen);
    }

    // 3. Render items list
    if (!this.cartItemsContainer) return;
    this.cartItemsContainer.innerHTML = '';

    const hasLoose = Object.keys(state.items).length > 0;
    const hasBundles = state.bundles.length > 0;
    const hasActiveSlots = state.filledSlotsCount > 0;

    if (!hasLoose && !hasBundles && !hasActiveSlots) {
      this.cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-chip-icon">🥔</div>
          <h4>Your basket is hungry!</h4>
          <p>Each packet is only <strong>₹20</strong>. Grab a flavor from the wall or build a 3-pack for ₹50!</p>
        </div>
      `;
      if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = '₹0.00';
      if (this.cartGrandTotalEl) this.cartGrandTotalEl.textContent = '₹0.00';
      if (this.orderBtnAmountEl) this.orderBtnAmountEl.textContent = '₹0.00';
      return;
    }

    // 3.1 Render Completed 3-Pack Bundles (₹50 each)
    state.bundles.forEach((bundleSlots, bIdx) => {
      const bundleCard = document.createElement('div');
      bundleCard.className = 'cart-item-row bundle-row';
      const names = bundleSlots.map(id => getFlavorById(id).name).join(' + ');

      bundleCard.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-title">
            <span class="bundle-badge">3-PACK SAVER</span>
            ₹${BOX_BUNDLE_PRICE} <span class="strike">₹60</span>
          </div>
          <div class="cart-item-subtitle">${names}</div>
        </div>
        <div class="cart-item-actions">
          <button class="cart-remove-bundle-btn" data-bidx="${bIdx}" title="Remove bundle">&times;</button>
          <div class="cart-item-price">₹${BOX_BUNDLE_PRICE}</div>
        </div>
      `;

      bundleCard.querySelector('.cart-remove-bundle-btn').addEventListener('click', () => {
        audioService.playClick();
        cartStore.removeBundle(bIdx);
      });

      this.cartItemsContainer.appendChild(bundleCard);
    });

    // 3.2 If user has unfinished slots in Build-A-Box
    if (state.filledSlotsCount > 0) {
      const inProgressCard = document.createElement('div');
      inProgressCard.className = 'cart-item-row draft-row';
      const names = state.slots.filter(Boolean).map(id => getFlavorById(id).name).join(', ');

      inProgressCard.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-title">Tray in Progress (${state.filledSlotsCount}/3)</div>
          <div class="cart-item-subtitle">${names}</div>
        </div>
        <div class="cart-item-actions">
          <button class="btn-clear-tray" title="Clear tray">Clear</button>
          <div class="cart-item-price">₹${state.filledSlotsCount * BASE_SINGLE_PRICE}</div>
        </div>
      `;

      inProgressCard.querySelector('.btn-clear-tray').addEventListener('click', () => {
        audioService.playClick();
        cartStore.clearSlots();
      });

      this.cartItemsContainer.appendChild(inProgressCard);
    }

    // 3.3 Render Individual Packets (₹20 each)
    Object.entries(state.items).forEach(([flavorId, qty]) => {
      const flavor = getFlavorById(flavorId);
      const itemPrice = qty * BASE_SINGLE_PRICE;
      const imgSrc = textureService.getPackImageSrc(flavor);

      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item-row';
      itemRow.innerHTML = `
        <div class="cart-item-thumb">
          <img src="${imgSrc}" alt="${flavor.name}" />
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${flavor.name}</div>
          <div class="cart-item-subtitle">₹${BASE_SINGLE_PRICE} each &bull; 50g</div>
        </div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn" data-action="minus" data-id="${flavorId}">-</button>
          <span class="cart-qty-num">${qty}</span>
          <button class="cart-qty-btn" data-action="plus" data-id="${flavorId}">+</button>
          <div class="cart-item-price">₹${itemPrice}</div>
        </div>
      `;

      itemRow.querySelector('[data-action="minus"]').addEventListener('click', () => {
        audioService.playClick();
        cartStore.addItem(flavorId, -1);
      });
      itemRow.querySelector('[data-action="plus"]').addEventListener('click', () => {
        audioService.playClick();
        cartStore.addItem(flavorId, 1);
      });

      this.cartItemsContainer.appendChild(itemRow);
    });

    // 4. Update Price Breakdown
    const totalPayable = state.subtotal + (state.filledSlotsCount * BASE_SINGLE_PRICE);
    const formatted = `₹${totalPayable.toFixed(2)}`;

    if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = formatted;
    if (this.cartGrandTotalEl) this.cartGrandTotalEl.textContent = formatted;
    if (this.orderBtnAmountEl) this.orderBtnAmountEl.textContent = formatted;
  }
}
