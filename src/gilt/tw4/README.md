Tailwind 4 source for the Gilt skin (theme tokens, @theme tokens, custom variants).

This app runs Tailwind 3.4, so the compiled stylesheet is checked in at
public/gilt-skin.css and linked by src/app/screening-room/page.tsx.

To regenerate after editing the skin TSX in src/gilt/video/ or the styles here,
compile with Tailwind 4 (this repo does not have it installed — run from a
project that does, e.g. the original skin scaffold, or `pnpm add -D
tailwindcss@4 @tailwindcss/cli` temporarily):

  npx @tailwindcss/cli@4.3.3 -i src/gilt/tw4/gilt-entry.css -o public/gilt-skin.css --minify

`@source "../video"` in gilt-entry.css points class scanning at the ported
components. `@import "tailwindcss"` inside skin.css must resolve to a TW4 install.
