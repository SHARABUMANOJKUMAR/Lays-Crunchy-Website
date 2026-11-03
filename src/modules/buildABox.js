import { FLAVORS, getFlavorById } from '../domain/flavors.js';
import { cartStore } from '../domain/cartStore.js';
import { audioService } from '../services/audioService.js';
import { textureService } from '../services/textureService.js';

/**
 * Build-A-Box Module
 * Renders the concept store 3-pack customizer seen in screen-4.png.
 */

export class BuildABox {
  constructor() {
    this.flavorGridEl = document.getElementById('box-flavor-grid');
    this.traySlotsEl = document.getElementById('box-tray-display');
    this.addBasketBtn = document.getElementById('box-add-basket-btn');
    
    this.init();
  }

  init() {
    this.renderFlavorSelectors();

    // Subscribe to cart store
    cartStore.subscribe((state) => {
      this.updateTray(state);
      this.updateCounters(state);
    });

    window.addEventListener('pack-image-loaded', (e) => {
      const { flavorId, src } = e.detail;
      const imgs = document.querySelectorAll(`[data-flavor="${flavorId}"]`);
      imgs.forEach(img => { img.src = src; });
    });

    if (this.addBasketBtn) {
      this.addBasketBtn.addEventListener('click', () => {
        const state = cartStore.getState();
        if (state.filledSlotsCount === 0) {
          audioService.playClick();
          return;
        }
        audioService.playCrunch(0.6);
        cartStore.addBoxToCart();
      });
    }
  }

  renderFlavorSelectors() {
    if (!this.flavorGridEl) return;
    this.flavorGridEl.innerHTML = '';

    FLAVORS.forEach((flavor) => {
      const item = document.createElement('div');
      item.className = 'box-flavor-item';
      item.dataset.id = flavor.id;

      const imgSrc = textureService.getPackImageSrc(flavor);

      item.innerHTML = `
        <div class="box-flavor-card">
          <div class="box-flavor-name">${flavor.name.toUpperCase()}</div>
          <div class="box-mini-bag">
            <img class="box-bag-img" data-flavor="${flavor.id}" src="${imgSrc}" alt="${flavor.name}" />
          </div>
          <div class="box-qty-badge" id="box-qty-${flavor.id}">+</div>
        </div>
      `;

      item.addEventListener('click', () => {
        audioService.playRustle(0.4);
        cartStore.addFlavorToSlot(flavor.id);
      });

      this.flavorGridEl.appendChild(item);
    });
  }

  updateCounters(state) {
    // Count how many times each flavor is present in the slots
    const counts = {};
    state.slots.forEach(id => {
      if (id) counts[id] = (counts[id] || 0) + 1;
    });

    FLAVORS.forEach(flavor => {
      const badge = document.getElementById(`box-qty-${flavor.id}`);
      const item = this.flavorGridEl.querySelector(`[data-id="${flavor.id}"]`);
      const count = counts[flavor.id] || 0;

      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.classList.add('has-count');
        } else {
          badge.textContent = '+';
          badge.classList.remove('has-count');
        }
      }

      if (item) {
        item.classList.toggle('is-selected', count > 0);
      }
    });

    // Update Add to Basket button state
    if (this.addBasketBtn) {
      const isFull = state.filledSlotsCount === 3;
      this.addBasketBtn.classList.toggle('btn-ready', isFull);
      if (isFull) {
        this.addBasketBtn.innerHTML = `<span>ADD TO BASKET</span> <span class="strike">$7.47</span> <span class="price-highlight">$5.98</span>`;
      } else {
        this.addBasketBtn.innerHTML = `<span>PICK ${3 - state.filledSlotsCount} MORE</span> <span class="price-highlight">$5.98</span>`;
      }
    }
  }

  updateTray(state) {
    if (!this.traySlotsEl) return;
    this.traySlotsEl.innerHTML = '';

    state.slots.forEach((flavorId, slotIdx) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'tray-slot';

      if (flavorId) {
        const flavor = getFlavorById(flavorId);
        const imgSrc = textureService.getPackImageSrc(flavor);

        slotEl.classList.add('filled');
        slotEl.innerHTML = `
          <div class="tray-bag-wrapper">
            <button class="tray-remove-btn" title="Remove from slot" data-idx="${slotIdx}">×</button>
            <img class="tray-bag-img" src="${imgSrc}" alt="${flavor.name}" />
            <div class="tray-bag-label">${flavor.name}</div>
          </div>
        `;

        slotEl.querySelector('.tray-remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          audioService.playClick();
          cartStore.removeSlot(slotIdx);
        });
      } else {
        slotEl.innerHTML = `
          <div class="tray-empty-placeholder">
            <div class="tray-slot-circle"></div>
            <span>SLOT 0${slotIdx + 1}</span>
          </div>
        `;
      }

      this.traySlotsEl.appendChild(slotEl);
    });
  }
}

