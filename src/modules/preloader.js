import gsap from 'gsap';
import { audioService } from '../services/audioService.js';

/**
 * Cinematic Preloader Module
 * Animates the spinning hero chip, seasoning burst, and seamless reveal of the page.
 */

export class Preloader {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.overlay = document.getElementById('preloader-overlay');
    this.chip = document.getElementById('preloader-chip');
    this.progressText = document.getElementById('preloader-progress');
    this.progressBar = document.getElementById('preloader-bar');
    this.statusText = document.getElementById('preloader-status');
    
    this.progress = { val: 0 };
    this.init();
  }

  init() {
    // Animate loader progress from 0% to 100%
    gsap.to(this.progress, {
      val: 100,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        const p = Math.round(this.progress.val);
        if (this.progressText) this.progressText.textContent = `${p}%`;
        if (this.progressBar) this.progressBar.style.width = `${p}%`;
        if (p > 60 && this.statusText) {
          this.statusText.textContent = 'SEASONING HERO CHIP...';
        }
      },
      onComplete: () => {
        this.seasonAndBurst();
      }
    });

    // Gentle 3D spin on hero chip graphic
    if (this.chip) {
      gsap.to(this.chip, {
        rotation: 360,
        duration: 4,
        repeat: -1,
        ease: 'none'
      });
    }
  }

  seasonAndBurst() {
    if (this.statusText) this.statusText.textContent = 'READY TO CRUNCH!';

    const tl = gsap.timeline({
      onComplete: () => {
        if (this.overlay) {
          this.overlay.style.display = 'none';
        }
        if (this.onComplete) {
          this.onComplete();
        }
      }
    });

    tl.to(this.chip, {
      scale: 1.35,
      duration: 0.35,
      ease: 'back.out(2)'
    })
    .call(() => {
      audioService.playCrunch(0.5);
    })
    .to(this.chip, {
      scale: 0,
      opacity: 0,
      duration: 0.28,
      ease: 'power3.in'
    })
    .to(this.overlay, {
      opacity: 0,
      duration: 0.65,
      ease: 'power2.inOut'
    }, '-=0.1');
  }
}

