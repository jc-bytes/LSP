# Change the LSP design

Edit `theme.css` first. Every page loads it before the component and layout styles.

## Common changes

| What you want to change | Variable |
| --- | --- |
| Background around the sidebar and top bar | `--color-background` |
| Main text | `--color-text` |
| Supporting text | `--color-text-muted` |
| Primary buttons and selected accents | `--color-primary` |
| Text on primary buttons | `--color-on-primary` |
| Primary button hover | `--color-primary-hover` |
| Panel and card surfaces | `--color-surface`, `--color-surface-raised` |
| Borders | `--color-border`, `--color-border-strong`, `--color-border-subtle` |
| Body font | `--font-body` |
| Code font | `--font-code` |
| Main text size | `--font-size-body` |
| Page heading size | `--font-size-page-title` |
| Button text size | `--font-size-button` |
| Panel, card, control rounding | `--radius-panel`, `--radius-card`, `--radius-control` |
| Desktop content padding | `--space-page` |
| Sidebar width | `--lsp-nav-width` |

A font name does not download a font. The current stack uses Inter if available, otherwise the operating system's sans-serif font. To require a custom font, supply licensed font files and add `@font-face`.

## File responsibilities

- `theme.css`: the only location for literal color values and font families. It also owns shared typography sizes and shell dimensions.
- `components.css`: shared exported controls, cards, motion UI, and responsive rules.
- `shell.css`: the current app shell and its visual overrides.
- `pages/*.css`: differences specific to login, catalog, and practice layouts.
- `shell.js`: collapse state, mobile drawer, and keyboard controls.
- `pages.css`: consistent page sizing, responsive grids, video proportions, and form layouts.
- `pages.js`: record labels, thumbnails, date formatting, and progressive result visibility. It does not own authentication or save operations.

Numbered palette variables retain older exported colors without changing their appearance during extraction. New styles should use semantic names such as `--color-text` and `--color-primary`. If an old component needs redesigning, migrate its palette variable to the matching semantic variable. Code editor palette values are separate from the app theme.

Change the primary background and its text color together. After a theme change, check login, catalog, practice, keyboard focus, and phone layout.

The HTML files are exported artifacts. Exporting them again from the original builder can replace this stylesheet integration. Keep these shared files and their stylesheet links when updating the export.

## Responsive validation

Run `node --test tests/presentation.test.cjs` and syntax-check the changed runtime scripts. Check layouts at 320, 390, 768, and 1440 pixels. Protected pages can be checked with disposable sample-data fixtures, but those checks do not prove authenticated database saves or physical camera recording.

Keep exported element order intact: the runtime derives binding identifiers from that order. Presentation rearrangements happen after initialization.
