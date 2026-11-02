# Pseudocode

### Boot
```
on load:
    start preloader (chip storm loop)
    create smooth scroll (Lenis), keep it stopped
    create 3D Experience (one WebGL canvas, one scene)
    load pack textures, HDR environment, ingredient models in parallel
    update preloader % as assets arrive
    when all ready:
        preloader: season the hero chip -> burst -> reveal page
        start Lenis, play hero intro timeline
```

### Hero carousel
```
bags = one 3D bag mesh per flavor, arranged on an arc
active = DEFAULT_FLAVOR
each frame:
    for each bag i:
        offset = wrap(i - active)                 # shortest circular distance
        target.position/rotation/scale = arcLayout(offset)
        bag.pose = lerp(bag.pose, target, damping)
    rings background: blend previous flavor colors -> new colors
                      outward from the center behind a feathered front
on arrow / drag / swipe / autoplay tick:
    active = (active +- 1) mod N
    retheme page (CSS vars from flavor.color / deep / glow / ink)
    animate title lines in
```

### Scroll story
```
one pinned ScrollTrigger timeline over the story section:
    progress 0..1 -> chapters 1..4
    scrub the bag rotation, camera dolly and hotspot callouts
    swap backdrop word and chapter bar per chapter
    after the story, a "storm" of chips crosses the screen
```

### Shop (Wall + Build-a-Box)
```
wall: one tall card per flavor
    image = transparent cut-out rendered from the real 3D bag
    on hover: ingredient pops up from behind the bag
box:  pick 3 flavors -> each lands in a tray slot (animated)
      basket counter and dots update; tray full -> enable checkout CTA
```

### Pack texture pipeline (offline, `tools/prep_packs.py`)
```
for each flavor photo:
    if "shot":   remove white backdrop automatically
    if "photo":  crop to the pack box
    unwarp the pillow outline so print lies flat
    lay out crimped seals matching the 3D bag geometry
    export 1024x1536 jpg, art edge to edge
```

[Back to README](README.md)

