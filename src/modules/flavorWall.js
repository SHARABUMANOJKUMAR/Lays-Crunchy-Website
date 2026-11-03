import { FLAVORS } from '../domain/flavors.js';
import { cartStore } from '../domain/cartStore.js';
import { audioService } from '../services/audioService.js';
import { textureService } from '../services/textureService.js';

/**
 * Flavor Wall Module
 * Renders the tactile card wall seen in screen-3.png and screen-5.png
 * with 3D interactive tilting cards, pop-out ingredients, and quick add actions.
 */

export class FlavorWall {
  constructor() {
    this.container = document.getElementById('flavor-wall-grid');
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = '';

    FLAVORS.forEach((flavor) => {
      const card = this.createCard(flavor);
      this.container.appendChild(card);
    });

    window.addEventListener('pack-image-loaded', (e) => {
      const { flavorId, src } = e.detail;
      const img = this.container.querySelector(`.wall-bag-img[data-flavor="${flavorId}"]`);
      if (img) img.src = src;
    });
  }

  createCard(flavor) {
    const card = document.createElement('div');
    card.className = 'wall-card';
    card.style.backgroundColor = flavor.wallCardBg || flavor.color;

    const imgSrc = textureService.getPackImageSrc(flavor);

    card.innerHTML = `
      <div class="wall-card-inner">
        <div class="wall-card-header">
          <div class="wall-card-title">${flavor.name.toUpperCase()}</div>
          <div class="wall-card-price">₹20</div>
        </div>
        <div class="wall-bag-container">
          <img class="wall-bag-img" data-flavor="${flavor.id}" src="${imgSrc}" alt="${flavor.name}" />
          <div class="wall-bag-shadow"></div>
        </div>
        <div class="wall-card-footer">
          <span class="wall-unit-tag">NET WT. 50g &bull; ₹20</span>
          <button class="wall-add-btn" aria-label="Add ${flavor.name} to box" data-id="${flavor.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // 3D Tilt interaction
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });

    // Add button handler - adds 1 bag (₹20) directly to cart and opens drawer
    const addBtn = card.querySelector('.wall-add-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioService.playCrunch(0.4);
      cartStore.addItem(flavor.id, 1);
      cartStore.openCart();

      // Tactile button bounce
      addBtn.classList.add('pop-animate');
      setTimeout(() => addBtn.classList.remove('pop-animate'), 350);
    });

    return card;
  }
}

