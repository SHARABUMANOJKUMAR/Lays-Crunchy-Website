import gsap from 'gsap';
import { FLAVORS } from '../domain/flavors.js';
import { audioService } from '../services/audioService.js';
import { textureService } from '../services/textureService.js';
import { cartStore } from '../domain/cartStore.js';

/**
 * The Rack Module
 * Tactile hanging bag rail and precision scrubber dial seen in screen-6.png.
 */

export class TheRack {
  constructor() {
    this.railContainer = document.getElementById('rack-rail-track');
    this.dialContainer = document.getElementById('rack-dial-track');
    this.dialCounter = document.getElementById('rack-current-counter');
    this.activeFlavorLabel = document.getElementById('rack-active-name');

    this.activeIndex = 2; // Default Barbecue (03) as in screenshot
    this.isDraggingDial = false;
    this.dragStartX = 0;
    this.scrollLeftStart = 0;

    this.init();
  }

  init() {
    this.renderHangingBags();
    this.renderDialTicks();
    this.updateActiveFlavor(this.activeIndex);

    window.addEventListener('pack-image-loaded', (e) => {
      const { flavorId, src } = e.detail;
      const img = this.railContainer.querySelector(`.rack-bag-img[data-flavor="${flavorId}"]`);
      if (img) img.src = src;
    });

    // Wheel drag interactions
    if (this.dialContainer) {
      this.dialContainer.addEventListener('pointerdown', (e) => {
        this.isDraggingDial = true;
        this.dragStartX = e.clientX;
        this.scrollLeftStart = this.dialContainer.scrollLeft;
        this.dialContainer.setPointerCapture(e.pointerId);
      });

      this.dialContainer.addEventListener('pointermove', (e) => {
        if (!this.isDraggingDial) return;
        const dx = e.clientX - this.dragStartX;
        this.dialContainer.scrollLeft = this.scrollLeftStart - dx;
      });

      this.dialContainer.addEventListener('pointerup', (e) => {
        this.isDraggingDial = false;
        try { this.dialContainer.releasePointerCapture(e.pointerId); } catch (_) { }
      });
    }
  }

  renderHangingBags() {
    if (!this.railContainer) return;
    this.railContainer.innerHTML = '';

    FLAVORS.forEach((flavor, idx) => {
      const bagSlot = document.createElement('div');
      bagSlot.className = 'rack-item';
      bagSlot.dataset.index = idx;

      const imgSrc = textureService.getPackImageSrc(flavor);

      bagSlot.innerHTML = `
        <div class="rack-hook">
          <div class="rack-clip"></div>
          <div class="rack-tag">
            <span class="rack-tag-num">${flavor.index}</span>
            <span class="rack-tag-line"></span>
          </div>
        </div>
        <div class="rack-bag-card">
          <img class="rack-bag-img" data-flavor="${flavor.id}" src="${imgSrc}" alt="${flavor.name}" />
        </div>
        <div class="rack-item-footer">
          <div class="rack-flavor-index">${flavor.index} / 09 &bull; <strong style="color:#FFCC00;">₹20</strong></div>
          <div class="rack-flavor-title">${flavor.name.toUpperCase()}</div>
          <button class="rack-taste-btn" data-id="${flavor.id}">ORDER NOW ₹20 →</button>
        </div>
      `;

      // Tap bag to spin on hook
      const bagCard = bagSlot.querySelector('.rack-bag-card');
      bagSlot.addEventListener('click', () => {
        audioService.playRustle(0.4);
        gsap.to(bagCard, {
          rotationY: '+=360',
          duration: 0.9,
          ease: 'power2.out'
        });
        this.updateActiveFlavor(idx);
      });

      // Quick add via "TASTE IT"
      const tasteBtn = bagSlot.querySelector('.rack-taste-btn');
      tasteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioService.playCrunch(0.5);
        cartStore.addItem(flavor.id, 1);
        cartStore.openCart();
      });

      this.railContainer.appendChild(bagSlot);
    });
  }

  renderDialTicks() {
    if (!this.dialContainer) return;
    this.dialContainer.innerHTML = '';

    const totalTicks = 90;
    const ticksWrapper = document.createElement('div');
    ticksWrapper.className = 'dial-ticks-wrapper';

    for (let i = 0; i < totalTicks; i++) {
      const tick = document.createElement('div');
      const isMajor = i % 10 === 0;
      tick.className = `dial-tick ${isMajor ? 'major' : ''}`;

      if (isMajor) {
        const flavorIdx = i / 10;
        if (flavorIdx < FLAVORS.length) {
          const numSpan = document.createElement('span');
          numSpan.className = 'dial-num';
          numSpan.textContent = FLAVORS[flavorIdx].index;
          tick.appendChild(numSpan);

          tick.addEventListener('click', () => {
            this.updateActiveFlavor(flavorIdx);
            audioService.playClick();
          });
        }
      }

      ticksWrapper.appendChild(tick);
    }

    this.dialContainer.appendChild(ticksWrapper);
  }

  updateActiveFlavor(idx) {
    this.activeIndex = idx;
    const flavor = FLAVORS[idx];
    if (!flavor) return;

    if (this.dialCounter) {
      this.dialCounter.textContent = `${flavor.index} / 09`;
    }

    // Scroll rail item into center
    const items = this.railContainer.querySelectorAll('.rack-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === idx);
      if (i === idx) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }
}

