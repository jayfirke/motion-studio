# Researching a real device or object

A device in a film must match the real one in size, corners, cutout, buttons, cameras and finish. Our first build of a phone used numbers from memory: "a generic Pro body, 71.5 × 149.6 × 8.25 mm, squircle corners, glass back and a square camera bump". The real device in the brief was 77.98 × 163.43 × 8.75 mm, with an aluminium unibody and a full-width camera plateau. The review said it looked like a demo phone. The second build used the maker's drawing and matched it within 0.17 mm.

## Where the numbers come from (in this order)

| Source | Gives | Confidence |
|---|---|---|
| The maker's dimensional or accessory drawing (PDF or CAD) | Everything: outline, corner curve, insets, cutout, buttons, ports, cameras, edge profile | Exact; use these numbers as they are |
| The maker's tech-specs page | Overall size, weight, display diagonal, finishes and their names | Exact for what it lists, but it lists little |
| Regulatory filings (for example FCC external photos and label drawings) | Photos of the real unit, some outline sizes | Good for checking, rough for measuring |
| Independent measurements (case makers, teardowns, reviews) | Whatever they measured | Mark as estimated; prefer two agreeing sources |
| Marketing renders, mockup kits, memory | Nothing | Never use for geometry |

**Apple** publishes a dimensional drawing for every iPhone in its Accessory Design Guidelines (Apple Developer, Accessories). The PDF lives at `https://developer.apple.com/download/files/accessories/dimensional-drawings/<model>.pdf`, for example `iphone-17-pro-max.pdf`, `iphone-17-pro.pdf`, `iphone-17.pdf` or `iphone-17e.pdf`. The drawings are copyrighted: keep the PDF and anything made from it in local scratch space, and never commit or publish them.

## Reading a drawing

1. Rasterize each sheet at 300 dpi:
   ```bash
   pdftoppm -r 300 -png iphone-17-pro-max.pdf sheet
   ```
2. **Each sheet has its own scale.** Measure px/mm on every sheet from a dimensioned length: the pixel distance divided by its millimetre value. Two sheets of the same PDF at 300 dpi came out at 8.643 and 11.522 px/mm.
3. **Dimensioned values** (body, glass, display, cutout, buttons, lens centres) go into the spec table as printed.
4. **Lines without dimensions** (plateau edges, back-window lines, antenna bands) are measured by scanning the pixels along a row or column for dark ink. That is good to about ±0.1 mm at 11.5 px/mm.
5. **Corner curves are drawn as a detail**, for example Apple's "Detail A". They are not circular arcs:
   - trace about seven points along the curve, from where it leaves one straight edge to where it meets the other;
   - run a monotone cubic through them;
   - build the cover-glass and display corners as parallel insets of that outline (offset along the normals), not as their own radii.
6. **Mind the mirror in the back view.** Apple's sheets use third-angle projection. On the back view, x measured from the back-left edge is the front view's right edge. Getting this wrong puts the camera plateau on the wrong side.
7. **Read the edge profile** (a section detail such as "Detail B") for the side shape: how the frame, gasket and glass edge meet, and how far the glass sits above the frame.

## The spec table

Keep it in `analysis/device.md`. Every row names its source (sheet, view, detail) and its confidence.

| Part | What to record |
|---|---|
| Body | Width × height × depth; outline corner points; edge profile |
| Front | Cover glass size and inset; display active-area size and inset; cutout size, shape and position; the receiver slit |
| Sides | Every button: centre from the top, length, height, how far it stands proud; sensors and controls such as a capture button; SIM tray; antenna bands |
| Bottom and top | Ports and holes: size and position along the edge; screws |
| Back | Camera plateau outline, height and ramp; every lens: ring diameter, centre, glass height; flash, sensor, mic; back window outline and corners |
| Finish | The maker's finish name and what each part is made of (anodised aluminium, frosted glass, polished trim, black border) |
| Screen | Native pixels and points; the cutout's size in screen pixels |

### Worked example: iPhone 17 Pro Max (Apple's drawing, 2025-09-09)

| Part | Value (mm) |
|---|---|
| Body | 77.98 × 163.43 × 8.75 |
| Outline corner (Detail A) | Meets both straight edges 19.43 from the corner. Points (in from the side, down from the top): (0, 19.43), (0.04, 13.9), (0.92, 8.46), (3.8, 3.8), (8.46, 0.92), (13.9, 0.04), (19.43, 0) |
| Cover glass | 75.58 × 161.03, 1.20 in from the housing all round |
| Display active area | 72.86 × 158.31, 2.56 in all round (the outline offset inwards, so its corners follow the housing curve) |
| Dynamic Island | 20.76 × 6.07, fully rounded, centre 7.91 below the top |
| Buttons (front-view left) | Action button centre 34.28 from the top, 6.90 long; volume buttons 48.43 and 62.63, 11.20 long; all 2.66 tall, 0.45 proud |
| Buttons (front-view right) | Side button 55.53, 17.70 long; Camera Control 111.82, sapphire 17.10 × 3.13, flush, polished surround |
| SIM tray (left) | 127.60 from the top, 16.10 × 2.56 |
| Bottom (Detail C) | USB-C 9.00 × 3.12 centred; 12 holes Ø1.53; two screws Ø1.50 |
| Camera plateau | Full width, 2.55 high, flat top with R9.5 corners, bottom edge 42.94 from the top, ramp 4.94 |
| Lenses (Detail D) | Rings Ø16.20 at (14.37, 14.37), (14.37, 33.61) and (32.36, 23.99), measured from the back-left edge and the top; lens glass 1.88 proud of the plateau; ring steps at r 8.10 / 7.43 / 6.82 / 6.23 |
| Flash, sensor, mic | Ø6.80, Ø6.65, Ø1.15 |
| Back window | Top edge 48.71 from the top, R9.3 corners |
| Antenna bands | 15.5–16.9 from the top and from the bottom, both long sides |
| Screen | 1320 × 2868 px (440 × 956 pt at 3×), 18.12 px per mm of display; the simulator's own island measures 376 × 110 px, which is 20.76 × 6.07 mm |
| Silver finish | Silver anodised aluminium unibody and plateau (satin), frosted near-white glass back window, black front border |

## Finish and colour

- Start from the maker's finish name and what each part is made of. For example, Silver is a silver aluminium unibody and plateau, a frosted near-white back window and a black front border.
- Product photos guide the colour, but judge it under the film's own light. Compare a still with a real photo of the device at a similar angle.
- **Metal has no colour of its own on screen: it shows what it reflects.**
  - Find which environment direction each face mirrors at the angles the film uses (a QA hook that reports the surface normal and the reflected view vector is enough).
  - Put soft light strips there. A side rail seen from the front mirrors the room beside and behind the device.
- These three.js `MeshPhysicalMaterial` values gave a believable silver under a soft studio PMREM:

  | Part | Values |
  |---|---|
  | Aluminium | colour `#dedfe1`, metalness 1, roughness 0.38, envMapIntensity 1.25 |
  | Flat back and plateau | roughness 0.62 |
  | Polished lens rings | colour `#eceef0`, roughness 0.40 |
  | Frosted window | colour `#c2c4c7`, roughness 0.34, clearcoat 0.8, clearcoatRoughness 0.45 |

  Use them as a starting point, then tune under the film's own camera.

## Screen content

- **Capture at the native pixel size** of the exact model. If the newest simulator runtime renders the app wrong (one showed the app as a black screen), use a device type with the same point size on an older runtime.
  - iOS clean status bar: `xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`.
  - Android: SystemUI demo mode (`adb shell settings put global sysui_demo_allowed 1`, then `adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941`).
- **Screenshots never include the hardware cutout** (Dynamic Island, notch, punch-hole). Draw it into the front image at the drawing's size and position, black, with a faint front-camera lens. Check its size in screen pixels against the simulator's own if the simulator draws one.
- **Clip the screenshot to the display outline** (the housing outline offset inwards by the display inset), not to a rectangle.
- **For 4K close-ups**, make 2× copies of the captures (Lanczos plus a light unsharp mask; 1320 × 2868 became 2640 × 5736). Give the texture mipmaps and the GPU's maximum anisotropy.
- **Use only demo data.** Never show a real person's name, number or account. Show only what the brief allows.
