# Lay's Crunch Experience - Official Style Guide

This style guide captures the visual design language, tokens, and component specifications extracted from the project documentation and official visual screenshots (`screenshots/screen-1.png` to `screen-6.png`).

---

## 1. Color Palette

### 1.1 Brand & Neutral Tokens
- **Background Cream (Shop / Rack):** `#EAE5DB` (warm sand/parchment)
- **Background Deep Cream:** `#DFD8CA`
- **Background Dark / Foil (Build-A-Box / Story):** `#0E1210` / `#161B18`
- **Surface Off-White:** `#F6F4EE`
- **Ink Primary (Dark Text):** `#111111`
- **Ink Secondary (Muted Dark):** `#555555`
- **Ink Inverted (Light Text):** `#FFFFFF`
- **Ink Inverted Muted:** `rgba(255, 255, 255, 0.65)`
- **Border Stitched / Dashed:** `rgba(0, 0, 0, 0.20)`
- **Border Stitched Light:** `rgba(255, 255, 255, 0.25)`

### 1.2 Accent & Interactive
- **Accent Red / CTA Primary ("First dibs"):** `#E23726` (Hover: `#C92C1D`)
- **Accent Yellow / Lay's Gold:** `#FFCC00` (Logo & Classic chip glow)
- **Accent Orange / Highlight:** `#FF6B00` (Slider indicator / badges)

### 1.3 Flavor Dynamic Theme Tokens
Each flavor defines a cohesive theme palette used for background rings, ambient lights, card accents, and text highlights:

| Flavor Key | Display Name | Primary Color (`color`) | Deep Vignette (`deep`) | Glow Highlight (`glow`) | Inverted Ink (`ink`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `flamin-hot` | Flamin' Hot | `#C21818` | `#4A0505` | `#FF4B4B` | `#FFFFFF` |
| `sour-cream` | Sour Cream & Onion | `#1F883D` | `#083311` | `#4CD964` | `#FFFFFF` |
| `barbecue` | Barbecue | `#A3411B` | `#3A1406` | `#D96B27` | `#FFFFFF` |
| `salt-vinegar`| Salt & Vinegar | `#0077B6` | `#022B42` | `#38BDF8` | `#FFFFFF` |
| `classic` | Classic | `#E5A800` | `#5C3D00` | `#FDE047` | `#111111` |
| `cheddar` | Cheddar & Sour Cream| `#D96515` | `#4D1C00` | `#FB923C` | `#FFFFFF` |
| `all-dressed` | All Dressed | `#6B21A8` | `#270742` | `#C084FC` | `#FFFFFF` |
| `sweet-southern`| Sweet Southern Heat BBQ | `#881337` | `#2D040F` | `#FB7185` | `#FFFFFF` |
| `bacon-grilled`| Bacon Grilled Cheese | `#B45309` | `#3E1802` | `#FBBF24` | `#FFFFFF` |

---

## 2. Typography

### 2.1 Font Families
- **Display / Impact:** `'Archivo Black', sans-serif, system-ui` (Uppercase, tight letter-spacing, heroic scale)
- **Body / Interface:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace / Indicators:** `'JetBrains Mono', monospace` (For chapter digits, counters, rack indexes)
- **Script / Accents:** `'Pacifico', cursive` (For flavor taste notes and badges)

### 2.2 Scale & Hierarchy
- **Hero Title (`H1`):** `clamp(3.5rem, 9vw, 9.5rem)`, weight `900`, line-height `0.88`, uppercase.
- **Section Headers (`H2`):** `clamp(2.5rem, 6vw, 5.5rem)`, weight `900`, line-height `0.92`, uppercase.
- **Card / Chapter Titles (`H3`):** `clamp(1.25rem, 2.5vw, 2.2rem)`, weight `800`, uppercase.
- **Eyebrow / Trackers:** `0.75rem - 0.85rem`, weight `700`, letter-spacing `0.18em`, uppercase, monospace.
- **Body Regular:** `1.0rem - 1.15rem`, weight `400` / `500`, line-height `1.55`.
- **Button / Pill Text:** `0.85rem - 0.95rem`, weight `700`, uppercase, letter-spacing `0.04em`.

---

## 3. Spacing Patterns

- **Base Unit:** `8px`
- **Grid Margins:** Viewport edge padding `clamp(16px, 3vw, 40px)`
- **Corner Markers:** Viewport corners decorated with delicate `+` crosshairs.
- **Component Padding:**
  - Nav bar pill: `6px 12px` (inner button: `8px 20px`)
  - Floating cards: `20px` to `32px`
  - Badges / chips: `4px 10px`
- **Gap Spacing:**
  - Card grid: `clamp(16px, 2vw, 24px)`
  - Nav links: `8px` to `16px`
  - Chapter hot spot cards: `12px`

---

## 4. Component Styling Rules

### 4.1 Navigation Bar
- Fixed top, high z-index, frosted glass backdrop (`backdrop-filter: blur(16px)`).
- Logo left: Circular Lay's emblem with "CRUNCH LAB" badge in uppercase monospace.
- Center Nav Pill: Segmented pill container (`rgba(255, 255, 255, 0.15)` or `rgba(0,0,0,0.06)`), active tab highlighted with a rounded capsule pill (`#FFFFFF` on dark / `#111111` on light).
- Sound pill: `[ ... OFF ]` / `[ ♫ ON ]` audio visualizer waves with state indicator.
- Basket pill: Cart icon with counter `[ 🛒 000 ]`.
- CTA Button: Pill button with bold red background `#E23726`, white text, soft glow on hover.

### 4.2 3D Bag Renderer & Canvas
- Single full-viewport fixed WebGL canvas behind HTML.
- Bags modeled as authentic pillow geometry with crimped heat seals top and bottom.
- PBR metallic/roughness foil reflection and realistic soft shadows.
- Concentric ring shader background reacting to active flavor with smooth gradient ripples.

### 4.3 Chapter Hotspot Callouts (Inside Story)
- Pulsing circular anchor point on the 3D bag.
- Angled connector stroke leading to a frosted glass callout box.
- Eyebrow title in monospace, concise benefit description.

### 4.4 Flavor Wall Cards
- Rounded rectangular cards (`border-radius: 20px`), stitched dashed border (`2px dashed rgba(0,0,0,0.18)`).
- Distinct background color matching each flavor's signature hue.
- Floating 3D/realistic pack render with subtle hover lift and tilt.
- Circular add button `+` pinned at bottom right with tactile feedback.

### 4.5 Build-a-Box Tray
- Split layout: Left column flavor selector with quantity counters `[ - ] [ count ] [ + ]`.
- Right column: Turntable turntable tray with 3 designated circular slots.
- When 3 slots are filled, active animated checkout bar: `ADD TO BASKET  ~~$7.47~~ $5.98`.

### 4.6 The Rack Rail
- Horizontal chrome/metallic rack rod with clips holding bags.
- Tactile scrubbable wheel/dial at the bottom with calibration ticks and orange active needle.
- Click to spin bag on its hook with natural spring physics.

