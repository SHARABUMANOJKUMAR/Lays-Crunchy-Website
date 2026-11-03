import gsap from 'gsap';
import { FLAVORS } from '../domain/flavors.js';
import { audioService } from '../services/audioService.js';

/**
 * Hero Carousel Module
 * Handles circular 3D bag carousel browsing, touch/drag gesture controls,
 * dynamic theme application, and synchronized typography animations.
 */

export class HeroCarousel {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.titleEl = document.getElementById('hero-flavor-title');
    this.subtitleEl = document.getElementById('hero-flavor-subtitle');
    this.indexEl = document.getElementById('hero-flavor-index');
    this.prevBtn = document.getElementById('hero-btn-prev');
    this.nextBtn = document.getElementById('hero-btn-next');
    this.autoplayBtn = document.getElementById('autoplay-btn');

    this.isAutoplay = false;
    this.autoplayTimer = null;
    this.dragStartX = 0;
    this.isDragging = false;

    this.init();
  }

  init() {
    this.updateContent(this.sceneManager.getActiveFlavor(), false);

    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.stopAutoplay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.stopAutoplay();
      });
    }

    // Autoplay toggle
    if (this.autoplayBtn) {
      this.autoplayBtn.addEventListener('click', () => {
        this.toggleAutoplay();
      });
    }

    // Drag / Touch gestures on hero
    const heroSection = document.getElementById('section-hero');
    if (heroSection) {
      heroSection.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        this.dragStartX = e.clientX;
        this.isDragging = true;
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.dragStartX;
        if (Math.abs(deltaX) > 65) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
          this.isDragging = false;
          this.stopAutoplay();
        }
      });

      window.addEventListener('pointerup', () => {
        this.isDragging = false;
      });
    }

    // Keyboard navigation - strictly disabled when user is typing in inputs or cart is open
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );
      if (isInputFocused) return;

      const cartDrawer = document.getElementById('cart-drawer');
      if (cartDrawer && cartDrawer.classList.contains('open')) return;

      if (e.key === 'ArrowLeft') {
        this.prev();
        this.stopAutoplay();
      } else if (e.key === 'ArrowRight') {
        this.next();
        this.stopAutoplay();
      }
    });
  }

  prev() {
    audioService.playWhoosh(0.3);
    const N = FLAVORS.length;
    const newIdx = (this.sceneManager.targetActive - 1 + N) % N;
    this.goTo(newIdx);
  }

  next() {
    audioService.playWhoosh(0.3);
    const N = FLAVORS.length;
    const newIdx = (this.sceneManager.targetActive + 1) % N;
    this.goTo(newIdx);
  }

  goTo(index) {
    this.sceneManager.setActiveFlavorIndex(index);
    const flavor = this.sceneManager.getActiveFlavor();
    this.updateContent(flavor, true);
    this.applyTheme(flavor);
  }

  updateContent(flavor, animate = true) {
    if (!flavor) return;

    if (animate) {
      // Bold title entrance animation
      gsap.fromTo(this.titleEl,
        { y: 35, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }
      );
      gsap.fromTo(this.indexEl,
        { scale: 1.25, opacity: 0.3 },
        { scale: 1, opacity: 0.85, duration: 0.5, ease: 'power2.out' }
      );
    }

    if (this.titleEl) this.titleEl.textContent = flavor.name.toUpperCase();
    if (this.subtitleEl) this.subtitleEl.textContent = flavor.subtitle.toUpperCase();
    if (this.indexEl) this.indexEl.textContent = flavor.index;
  }

  applyTheme(flavor) {
    // Retheme page CSS variables as specified in PSEUDOCODE.md
    const root = document.documentElement;
    root.style.setProperty('--flavor-color', flavor.color);
    root.style.setProperty('--flavor-deep', flavor.deep);
    root.style.setProperty('--flavor-glow', flavor.glow);
    root.style.setProperty('--flavor-ink', flavor.ink);
  }

  toggleAutoplay() {
    if (this.isAutoplay) {
      this.stopAutoplay();
    } else {
      this.startAutoplay();
    }
  }

  startAutoplay() {
    this.isAutoplay = true;
    if (this.autoplayBtn) {
      this.autoplayBtn.classList.add('active');
      this.autoplayBtn.innerHTML = '<span>▶</span> AUTOPLAYING';
    }
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, 4200);
  }

  stopAutoplay() {
    this.isAutoplay = false;
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
    if (this.autoplayBtn) {
      this.autoplayBtn.classList.remove('active');
      this.autoplayBtn.innerHTML = '<span>||</span> AUTOPLAY';
    }
  }
}

