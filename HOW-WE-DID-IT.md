# How we did it

1. **Scaffold.** Vite project with Three.js, GSAP, Lenis and fontsource fonts (Archivo variable, Inter, JetBrains Mono, Pacifico).
2. **One canvas, many sections.** A single fixed WebGL canvas (`scene.js`) sits behind the HTML. Scroll position and carousel state are shared values that the 3D scene reads each frame, so bags can move between sections without a second renderer.
3. **Bags.** `bag.js` builds a pillow-shaped bag with crimped seals. `textures.js` generates fallback artwork, and the real art from `public/packs` replaces it when present.
4. **Pack art.** `tools/prep_packs.py` cleans raw photos into flat 1024x1536 textures (background removal, unwarp, seal layout).
5. **Ingredients.** `ingredients.js` and `chipfield.js` float small Sketchfab models and the ring background around the hero. Models are optimized with gltf-transform (512px WebP, meshopt).
6. **Choreography.** GSAP ScrollTrigger scrubs the story chapters and Lenis gives the smooth scroll. Mobile URL-bar resizes are ignored so the timeline doesn't jump.
7. **Shop.** `shop.js` renders cut-out product images straight from the 3D bags, so the shop always matches the hero.
8. **Preloader.** `preloader.js` runs the chip storm, then the hero chip spins and is seasoned while assets load.
9. **Polish.** Same layout on mobile as on laptop, a stable viewport, Safari and Windows testing, and fast-load tuning (compressed HDR, lazy extras).

[Back to README](README.md)

