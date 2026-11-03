import * as THREE from 'three';

/**
 * Texture Generation Service
 * Renders high-fidelity 1024x1536 bag textures dynamically on canvas.
 * Produces authentic Lay's branding, crimped foil seals, flavor artwork, and micro-textures.
 */

class TextureService {
  constructor() {
    this.cache = new Map();
    this.imageSrcCache = new Map();
    this.loader = new THREE.TextureLoader();
  }

  /**
   * Automatically removes white studio background from pack photos to create transparent cutouts
   */
  createTransparentCutout(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 600;
    canvas.height = img.naturalHeight || img.height || 800;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Simple and robust: make near-white background transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is near-white studio backdrop
        if (r > 235 && g > 235 && b > 235) {
          data[i + 3] = 0;
        } else if (r > 220 && g > 220 && b > 220) {
          // Soft anti-aliased edge
          const alpha = 1.0 - (Math.min(r, g, b) - 220) / 15.0;
          data[i + 3] = Math.round(data[i + 3] * Math.max(0, alpha));
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (_) {
      return img.src;
    }
  }

  /**
   * Returns a 2D image source URL (either custom image or canvas DataURL)
   */
  getPackImageSrc(flavor) {
    if (this.imageSrcCache.has(flavor.id)) {
      return this.imageSrcCache.get(flavor.id);
    }

    const targetUrl = flavor.packImage || flavor.cloudinaryUrl;
    if (targetUrl) {
      // Create transparent cutout on load
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetUrl;
      img.onload = () => {
        const cutout = this.createTransparentCutout(img);
        this.imageSrcCache.set(flavor.id, cutout);
        window.dispatchEvent(new CustomEvent('pack-image-loaded', { detail: { flavorId: flavor.id, src: cutout } }));
      };
      // Temporary return until loaded
      this.imageSrcCache.set(flavor.id, targetUrl);
      return targetUrl;
    }

    const tex = this.getBagTexture(flavor);
    const src = tex.image ? tex.image.toDataURL('image/jpeg', 0.85) : '';
    this.imageSrcCache.set(flavor.id, src);
    return src;
  }

  getBagTexture(flavor) {
    if (this.cache.has(flavor.id)) {
      return this.cache.get(flavor.id);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    this.drawBagArtwork(ctx, canvas.width, canvas.height, flavor);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.generateMipmaps = true;

    this.cache.set(flavor.id, texture);

    // Load actual pack image (local or remote)
    const targetUrl = flavor.packImage || flavor.cloudinaryUrl;
    if (targetUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetUrl;
      img.onload = () => {
        // Composite onto high-res bag canvas with crimped seals
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Base gradient
        const bgGrad = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.42, 60, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.85);
        bgGrad.addColorStop(0, flavor.glow || flavor.color);
        bgGrad.addColorStop(0.5, flavor.color);
        bgGrad.addColorStop(1, flavor.deep || '#220000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw cutout onto the canvas body area
        const cutoutData = this.createTransparentCutout(img);
        const cutoutImg = new Image();
        cutoutImg.src = cutoutData;
        cutoutImg.onload = () => {
          ctx.save();
          const packH = canvas.height - 180;
          const packW = canvas.width;
          ctx.drawImage(cutoutImg, 0, 90, packW, packH);
          ctx.restore();

          // 3. Re-draw top and bottom 3D crimped seals
          this.drawCrimpSeal(ctx, 0, 0, canvas.width, 110, true);
          this.drawCrimpSeal(ctx, 0, canvas.height - 110, canvas.width, 110, false);

          texture.needsUpdate = true;
        };
      };
    }

    return texture;
  }

  drawBagArtwork(ctx, w, h, flavor) {
    // 1. Base bag background with radial gradient
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 60, w * 0.5, h * 0.5, w * 0.85);
    bgGrad.addColorStop(0, flavor.glow || flavor.color);
    bgGrad.addColorStop(0.45, flavor.color);
    bgGrad.addColorStop(1, flavor.deep || '#220000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Foil wrinkles and metallic sheen lines
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 45; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      const y = Math.random() * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + Math.random() * 60 - 30, w * 0.7, y + Math.random() * 60 - 30, w, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Top and Bottom Crimped Seals
    this.drawCrimpSeal(ctx, 0, 0, w, 110, true);
    this.drawCrimpSeal(ctx, 0, h - 110, w, 110, false);

    // 4. Subtle center lighting vignette
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.2, w * 0.5, h * 0.45, w * 0.6);
    vignette.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 110, w, h - 220);

    // 5. Authentic Lay's Sunburst Logo
    this.drawLaysLogo(ctx, w * 0.5, h * 0.34, 185);

    // 6. Flavor Title Plate
    this.drawFlavorPlate(ctx, w * 0.5, h * 0.53, flavor);

    // 7. Golden Crisp Chips & Ingredients Illustration
    this.drawFoodIllustration(ctx, w * 0.5, h * 0.73, flavor);

    // 8. Quality Guarantee Badges
    this.drawBadges(ctx, w, h, flavor);
  }

  drawCrimpSeal(ctx, x, y, width, height, isTop) {
    ctx.save();
    // Seal backdrop
    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    if (isTop) {
      grad.addColorStop(0, '#222222');
      grad.addColorStop(0.3, '#555555');
      grad.addColorStop(0.7, '#1A1A1A');
      grad.addColorStop(1, '#333333');
    } else {
      grad.addColorStop(0, '#333333');
      grad.addColorStop(0.3, '#1A1A1A');
      grad.addColorStop(0.7, '#555555');
      grad.addColorStop(1, '#222222');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);

    // Vertical serrated ridges
    const ridgeCount = 68;
    const step = width / ridgeCount;
    for (let i = 0; i < ridgeCount; i++) {
      const rx = x + i * step;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(rx, y, step * 0.65, height);
    }

    // Top edge serrated notch if top
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    for (let i = 0; i <= ridgeCount; i++) {
      const px = x + i * step;
      const py = isTop ? y : y + height;
      const notch = isTop ? 4 : -4;
      if (i === 0) ctx.moveTo(px, py);
      ctx.lineTo(px + step * 0.5, py + notch);
      ctx.lineTo(px + step, py);
    }
    ctx.fill();

    ctx.restore();
  }

  drawLaysLogo(ctx, cx, cy, radius) {
    ctx.save();

    // Soft sunburst outer glow
    const sunGlow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.5);
    sunGlow.addColorStop(0, 'rgba(255, 220, 0, 0.45)');
    sunGlow.addColorStop(1, 'rgba(255, 180, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sun Disc
    const discGrad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 10, cx, cy, radius);
    discGrad.addColorStop(0, '#FFF480');
    discGrad.addColorStop(0.35, '#FFCC00');
    discGrad.addColorStop(0.85, '#F5A623');
    discGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Dark red border ring
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#8B0000';
    ctx.stroke();

    // Iconic curved Red Banner
    ctx.save();
    ctx.translate(cx, cy + 18);
    ctx.rotate(-0.06);

    const bw = radius * 2.15;
    const bh = radius * 0.76;

    // Banner shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Red banner gradient
    const bannerGrad = ctx.createLinearGradient(0, -bh * 0.5, 0, bh * 0.5);
    bannerGrad.addColorStop(0, '#E6242B');
    bannerGrad.addColorStop(0.5, '#C61A20');
    bannerGrad.addColorStop(1, '#9B0E13');

    ctx.fillStyle = bannerGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw * 0.5, bh * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Banner golden outline
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#FFE066';
    ctx.stroke();

    // Stylized "Lay's" Text
    ctx.font = '900 115px "Arial Black", "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black text drop shadow
    ctx.fillStyle = '#000000';
    ctx.fillText("Lay's", 2, 8);

    // Crisp white text with blue/red accent
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("Lay's", 0, 2);

    ctx.restore();

    ctx.restore();
  }

  drawFlavorPlate(ctx, cx, cy, flavor) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Plate background capsule
    const text = flavor.name.toUpperCase();
    ctx.font = '900 64px "Arial Black", "Impact", sans-serif';
    const metrics = ctx.measureText(text);
    const boxW = Math.max(metrics.width + 80, 520);
    const boxH = 92;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(cx - boxW * 0.5, cy - boxH * 0.5, boxW, boxH, 46);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gold / White typography
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(text, cx, cy);

    // Subtitle tagline
    ctx.font = '800 22px "Arial", sans-serif';
    ctx.fillStyle = '#FFDD66';
    ctx.letterSpacing = '4px';
    ctx.fillText('POTATO CHIPS • REAL POTATOES', cx, cy + 62);

    ctx.restore();
  }

  drawFoodIllustration(ctx, cx, cy, flavor) {
    ctx.save();

    // Draw realistic golden potato chip stacks
    this.drawGoldenChip(ctx, cx - 70, cy + 30, 160, 105, -0.22, flavor);
    this.drawGoldenChip(ctx, cx + 80, cy + 20, 175, 115, 0.28, flavor);
    this.drawGoldenChip(ctx, cx, cy + 55, 200, 130, 0.05, flavor);

    // Flavor specific garnish
    if (flavor.id === 'flamin-hot' || flavor.id === 'sweet-southern') {
      // Red chili pepper
      this.drawChiliPepper(ctx, cx + 160, cy - 40);
      this.drawSparks(ctx, cx, cy, '#FF3300');
    } else if (flavor.id === 'sour-cream') {
      // Sour cream cup & chives
      this.drawCreamBowl(ctx, cx - 150, cy - 10);
      this.drawChives(ctx, cx, cy);
    } else if (flavor.id === 'barbecue') {
      // BBQ basting pot & spice rub
      this.drawBBQSmoke(ctx, cx, cy);
    } else if (flavor.id === 'salt-vinegar') {
      // Salt crystals & vinegar cruet
      this.drawSaltCrystals(ctx, cx - 140, cy);
    }

    ctx.restore();
  }

  drawGoldenChip(ctx, x, y, w, h, angle, flavor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Chip shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;

    // Organic chip geometry
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, 0);
    ctx.bezierCurveTo(-w * 0.4, -h * 0.55, w * 0.4, -h * 0.5, w * 0.48, 0);
    ctx.bezierCurveTo(w * 0.42, h * 0.6, -w * 0.35, h * 0.55, -w * 0.45, 0);
    ctx.closePath();

    // Golden fried potato gradient
    const chipGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
    chipGrad.addColorStop(0, '#FFE89E');
    chipGrad.addColorStop(0.3, '#FFCC4D');
    chipGrad.addColorStop(0.7, '#E59B20');
    chipGrad.addColorStop(1, '#B86500');
    ctx.fillStyle = chipGrad;
    ctx.fill();

    // Toasted brown crisp edges
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(160, 75, 0, 0.6)';
    ctx.stroke();

    // Seasoning dust speckles
    ctx.fillStyle = flavor.glow || '#E23726';
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 35; i++) {
      const sx = (Math.random() - 0.5) * (w * 0.7);
      const sy = (Math.random() - 0.5) * (h * 0.7);
      const sr = 1.2 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawChiliPepper(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.35);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 15;

    // Pepper body
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.bezierCurveTo(35, -20, 25, 40, -10, 80);
    ctx.bezierCurveTo(-5, 50, -20, 10, -10, -60);
    ctx.closePath();

    const redGrad = ctx.createLinearGradient(-20, -60, 30, 80);
    redGrad.addColorStop(0, '#FF3B30');
    redGrad.addColorStop(0.5, '#CC0000');
    redGrad.addColorStop(1, '#660000');
    ctx.fillStyle = redGrad;
    ctx.fill();

    // Green stem
    ctx.fillStyle = '#28A745';
    ctx.beginPath();
    ctx.moveTo(-5, -60);
    ctx.bezierCurveTo(-15, -75, -5, -85, 5, -88);
    ctx.lineTo(8, -80);
    ctx.bezierCurveTo(2, -75, 5, -65, 5, -60);
    ctx.fill();

    ctx.restore();
  }

  drawCreamBowl(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Bowl
    ctx.fillStyle = '#E8E8E8';
    ctx.beginPath();
    ctx.ellipse(0, 20, 50, 30, 0, 0, Math.PI);
    ctx.fill();
    // Cream
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 16, 48, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Chive sprinkles
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect((Math.random() - 0.5) * 60, 10 + (Math.random() - 0.5) * 20, 4, 2);
    }
    ctx.restore();
  }

  drawChives(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 120, cy + 20);
    ctx.bezierCurveTo(cx + 140, cy - 20, cx + 160, cy - 40, cx + 180, cy - 30);
    ctx.stroke();
    ctx.restore();
  }

  drawBBQSmoke(ctx, cx, cy) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#FFA726';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx - 110 + i * 20, cy - 30 - i * 15, 25 + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSaltCrystals(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 16; i++) {
      const rx = (Math.random() - 0.5) * 80;
      const ry = (Math.random() - 0.5) * 50;
      ctx.fillRect(rx, ry, 7, 7);
    }
    ctx.restore();
  }

  drawSparks(ctx, cx, cy, color) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 140;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBadges(ctx, w, h, flavor) {
    ctx.save();

    // Top left badge: "NO ARTIFICIAL FLAVORS"
    ctx.font = '700 17px "Arial", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('NO ARTIFICIAL', 60, 160);
    ctx.fillText('FLAVORS', 60, 182);

    // Top right badge: "GUARANTEED FRESH"
    ctx.textAlign = 'right';
    ctx.fillText('GUARANTEED', w - 60, 160);
    ctx.fillText('FRESH UNTIL PRINTED DATE', w - 60, 182);

    // Bottom Net Wt badge
    ctx.font = '700 19px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('NET WT. 8 OZ. (226.8g)', w * 0.5, h - 145);

    ctx.restore();
  }
}

export const textureService = new TextureService();

