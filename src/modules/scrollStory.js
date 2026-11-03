import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { audioService } from '../services/audioService.js';

gsap.registerPlugin(ScrollTrigger);

export const CHAPTERS = [
  {
    index: '01',
    label: 'THE BAG',
    title: 'BUILT TO PROTECT',
    copy: 'A pillow of air cushions every chip, while a multi-layer foil-lined film keeps out destructive light and moisture until the moment you tear it open.',
    hotspots: [
      { x: 55, y: 22, title: 'HEAT-SEALED CRIMP', desc: 'Locks the freshness in' },
      { x: 42, y: 38, title: 'FOIL-LINED FILM', desc: 'Blocks light & moisture' },
      { x: 48, y: 64, title: 'AIR CUSHION', desc: 'Keeps every chip whole' }
    ]
  },
  {
    index: '02',
    label: 'THE HARVEST',
    title: 'FARM-GROWN ROOTS',
    copy: 'Sourced directly from certified family farms across North America. Selected for starch density and sliced to micro-precision for maximum crisp surface area.',
    hotspots: [
      { x: 52, y: 30, title: 'RUSSET SELECTION', desc: 'Peak solid-to-water ratio' },
      { x: 45, y: 55, title: 'PRECISION CUT', desc: 'Uniform 0.05" golden thickness' }
    ]
  },
  {
    index: '03',
    label: 'THE FLAVOR',
    title: 'MICRO-DUSTED RUB',
    copy: 'Tumbled in spinning drums right out of the cooker while the natural oils are warm, locking the seasoning into every microscopic pocket and ridge.',
    hotspots: [
      { x: 58, y: 28, title: 'ELECTRO-DUSTING', desc: 'Even surface seasoning coat' },
      { x: 44, y: 62, title: 'WARM OIL INFUSION', desc: 'Locks flavor deep into crisp' }
    ]
  },
  {
    index: '04',
    label: 'THE CRUNCH',
    title: 'ACOUSTIC CRACK',
    copy: 'Engineered for the iconic sound signature: an initial 65-decibel high-frequency shatter that signals ultimate potato chip freshness to your senses.',
    hotspots: [
      { x: 50, y: 45, title: '65 dB SHATTER', desc: 'Clinically tuned audible snap' },
      { x: 60, y: 68, title: 'INSTANT MELT', desc: 'Dissolves cleanly on palate' }
    ]
  }
];

export class ScrollStory {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.section = document.getElementById('section-inside');
    this.chapterIndexEl = document.getElementById('story-chapter-num');
    this.chapterLabelEl = document.getElementById('story-chapter-label');
    this.titleEl = document.getElementById('story-title');
    this.copyEl = document.getElementById('story-copy');
    this.progressBarEl = document.getElementById('story-progress-bar');
    this.hotspotsContainer = document.getElementById('story-hotspots-container');
    this.railButtons = document.querySelectorAll('.story-rail-btn');

    this.currentChapter = 0;
    this.init();
  }

  init() {
    if (!this.section) return;

    // Pin the story section and scrub through 4 chapters
    ScrollTrigger.create({
      trigger: this.section,
      start: 'top top',
      end: '+=3200',
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const progress = self.progress;
        this.sceneManager.setScrollProgress(progress);

        // Determine active chapter (0 to 3)
        const chapterIdx = Math.min(3, Math.floor(progress * 4));
        if (chapterIdx !== this.currentChapter) {
          this.setChapter(chapterIdx);
        }

        // Update progress bar
        if (this.progressBarEl) {
          this.progressBarEl.style.width = `${Math.min(100, Math.max(5, progress * 100))}%`;
        }

        // If at the end of the story, trigger chip storm
        if (progress > 0.94 && !this.stormTriggered) {
          this.stormTriggered = true;
          this.sceneManager.chipField.triggerStorm();
          audioService.playCrunch(0.65);
        } else if (progress < 0.85) {
          this.stormTriggered = false;
        }
      }
    });

    // Rail button clicks
    this.railButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        this.setChapter(idx);
        audioService.playClick();
      });
    });

    this.renderChapter(0, false);
  }

  setChapter(idx) {
    this.currentChapter = idx;
    this.renderChapter(idx, true);
  }

  renderChapter(idx, animate = true) {
    const ch = CHAPTERS[idx];
    if (!ch) return;

    if (this.chapterIndexEl) this.chapterIndexEl.textContent = ch.index;
    if (this.chapterLabelEl) this.chapterLabelEl.textContent = `— CHAPTER ${ch.index} — ${ch.label}`;
    if (this.titleEl) this.titleEl.textContent = ch.title;
    if (this.copyEl) this.copyEl.textContent = ch.copy;

    // Highlight rail button
    this.railButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });

    // Render hotspot callout pins
    this.renderHotspots(ch.hotspots);

    if (animate) {
      gsap.fromTo(this.titleEl,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
      gsap.fromTo(this.copyEl,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      );
    }
  }

  renderHotspots(hotspots) {
    if (!this.hotspotsContainer) return;
    this.hotspotsContainer.innerHTML = '';

    hotspots.forEach((h, i) => {
      const pin = document.createElement('div');
      pin.className = 'hotspot-pin';
      pin.style.left = `${h.x}%`;
      pin.style.top = `${h.y}%`;

      pin.innerHTML = `
        <div class="hotspot-pulse"></div>
        <div class="hotspot-dot"></div>
        <div class="hotspot-card">
          <div class="hotspot-eyebrow">${h.title}</div>
          <div class="hotspot-text">${h.desc}</div>
        </div>
      `;

      pin.addEventListener('click', () => {
        audioService.playClick(0.3);
      });

      this.hotspotsContainer.appendChild(pin);

      gsap.fromTo(pin,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, delay: i * 0.1, ease: 'back.out(2)' }
      );
    });
  }
}

