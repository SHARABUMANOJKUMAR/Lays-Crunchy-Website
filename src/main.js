import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { SceneManager } from './scene/sceneManager.js';
import { Preloader } from './modules/preloader.js';
import { HeroCarousel } from './modules/heroCarousel.js';
import { ScrollStory } from './modules/scrollStory.js';
import { FlavorWall } from './modules/flavorWall.js';
import { BuildABox } from './modules/buildABox.js';
import { TheRack } from './modules/theRack.js';
import { CartDrawer } from './modules/cartDrawer.js';
import { cartStore } from './domain/cartStore.js';
import { audioService } from './services/audioService.js';

gsap.registerPlugin(ScrollTrigger);

class App {
  constructor() {
    this.canvasContainer = document.getElementById('webgl-canvas-container');
    this.init();
  }

  init() {
    // 1. Initialize Lenis Smooth Scroll (kept stopped during preloader)
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    window.lenisInstance = this.lenis;
    window.history.scrollRestoration = 'manual';
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    this.lenis.stop();

    // 2. Initialize 3D Experience
    this.sceneManager = new SceneManager(this.canvasContainer);

    // 3. Initialize Feature Modules
    this.heroCarousel = new HeroCarousel(this.sceneManager);
    this.scrollStory = new ScrollStory(this.sceneManager);
    this.flavorWall = new FlavorWall();
    this.buildABox = new BuildABox();
    this.theRack = new TheRack();
    this.cartDrawer = new CartDrawer();

    // 4. Setup Audio & Navigation Controls
    this.setupAudioToggle();
    this.setupNavigation();

    // 5. Run Cinematic Preloader
    this.preloader = new Preloader(() => {
      this.onPreloaderComplete();
    });
  }

  onPreloaderComplete() {
    // Start smooth scroll
    this.lenis.start();

    // Play hero intro timeline
    const tl = gsap.timeline();
    tl.from('.site-nav', {
      y: -80,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .from('.hero-flavor-title', {
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out'
    }, '-=0.4')
    .from('.hero-bottom-right', {
      x: 60,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out'
    }, '-=0.5');
  }

  setupAudioToggle() {
    const soundBtn = document.getElementById('nav-sound-toggle');
    const soundText = document.getElementById('sound-text');
    const soundIcon = document.getElementById('sound-icon');

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = !audioService.toggleSound();
        if (isMuted) {
          soundText.textContent = 'OFF';
          soundIcon.textContent = '...';
          soundBtn.classList.remove('active');
        } else {
          soundText.textContent = 'ON';
          soundIcon.textContent = '♫';
          soundBtn.classList.add('active');
        }
      });
    }
  }

  setupNavigation() {
    // 1. Desktop Nav tabs smooth scroll
    const navTabs = document.querySelectorAll('.nav-tab-btn');
    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = tab.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          audioService.playClick();
          this.lenis.scrollTo(targetEl, { offset: 0, duration: 1.4 });
        }
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // 2. Mobile & Tablet Hamburger Navigation
    const hamburgerBtn = document.getElementById('nav-hamburger-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    const mobileCloseBtn = document.getElementById('mobile-nav-close-btn');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    const mobileCartTrigger = document.getElementById('mobile-cart-trigger');

    const toggleMobileNav = (open) => {
      if (!mobileDrawer) return;
      const isOpen = open !== undefined ? open : !mobileDrawer.classList.contains('open');
      mobileDrawer.classList.toggle('open', isOpen);
      if (hamburgerBtn) {
        hamburgerBtn.classList.toggle('active', isOpen);
        hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
      }
      document.body.classList.toggle('mobile-nav-locked', isOpen);
      audioService.playClick();
    };

    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', () => toggleMobileNav());
    }
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', () => toggleMobileNav(false));
    }
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', () => toggleMobileNav(false));
    }

    // Mobile nav link tap: scroll to target, update active state & close drawer
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          audioService.playClick();
          toggleMobileNav(false);
          setTimeout(() => {
            this.lenis.scrollTo(targetEl, { offset: 0, duration: 1.2 });
          }, 250);
        }
        mobileLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Mobile Cart Trigger inside Mobile Menu
    if (mobileCartTrigger) {
      mobileCartTrigger.addEventListener('click', () => {
        toggleMobileNav(false);
        setTimeout(() => {
          cartStore.openCart();
        }, 200);
      });
    }

    // Escape key listener for accessible dismissal of drawers
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (mobileDrawer && mobileDrawer.classList.contains('open')) {
          toggleMobileNav(false);
        }
      }
    });

    // 3. "First dibs" CTA
    const dibsBtn = document.getElementById('nav-first-dibs-btn');
    if (dibsBtn) {
      dibsBtn.addEventListener('click', () => {
        audioService.playCrunch(0.5);
        const shopEl = document.getElementById('section-build-box');
        if (shopEl) {
          this.lenis.scrollTo(shopEl, { offset: 0, duration: 1.2 });
        }
      });
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
