# ONOD Fonts — Monochrome UI Contract

Status: **required**

## Product rule

ONOD Fonts uses a strictly monochrome interface. The rendered product may use only:

- black;
- white;
- neutral gray values;
- transparent variants of those values.

Chromatic accents are not part of the product language.

## Applies to

The rule covers every interactive and decorative state, including:

- default UI;
- hover, active, pressed and selected states;
- focus rings and keyboard states;
- status badges and trust indicators;
- success, warning, error and destructive states;
- charts and data visualizations;
- icons, SVG marks and illustrations;
- photographs and other media used inside the interface;
- loading, fallback and empty states;
- toasts, dialogs and overlays.

## Semantic states without color

Meaning must be communicated through structure rather than hue.

Preferred tools:

1. contrast and luminance;
2. filled vs outlined surfaces;
3. border weight/style;
4. icon shape;
5. explicit status labels;
6. typography weight/case/tracking;
7. spatial hierarchy.

Examples:

- VERIFIED: dark filled badge or high-contrast border;
- PENDING: outlined gray badge;
- FALLBACK / ERROR: stronger black border, warning icon and explicit text;
- SUCCESS: check icon + neutral high-contrast state;
- DESTRUCTIVE: black/dark neutral treatment, never red.

## Token rules

Semantic tokens in `src/styles/globals.css` must resolve to neutral values only.

- HEX/RGB: R = G = B for opaque colors.
- OKLCH: chroma must be `0`.
- HSL: saturation must be `0%`.
- Tailwind UI work should prefer `neutral-*`, `black`, `white`, `transparent` and `currentColor`.

Do not introduce `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink` or `rose` as UI colors.

## Media

Interface media is presented in grayscale. Hover and interactive states must not restore chromatic color.

## Review gate

Any future visual change must be reviewed against this contract before merge. A feature that requires semantic differentiation must solve it through hierarchy and form rather than adding a color accent.
