# Helmstones one-page website

This is a self-contained static website. No build step or third-party package is required.

## Edit the wording

Open `content.md` in any text editor. Change the text after the bold labels and save. Keep the section headings and bold labels themselves unchanged.

The same file also contains:

- the £285 prices
- watch specifications and feature lists
- button labels and destinations
- email links
- image paths and alt text
- page title and search description

Refresh the browser after saving.

## Preview locally

Because the page loads `content.md`, preview it through a small local web server rather than double-clicking `index.html`.

From this folder, run:

```powershell
python -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

Stop the server with `Ctrl+C`.

## Files

- `index.html` — page structure
- `styles.css` — colours, typography, layout and responsive rules
- `app.js` — loads the Markdown and creates the watch sections
- `content.md` — all editable website wording and product data
- `assets/` — optimised watch and logo images

## Before publishing

The enquiry links currently use `hello@helmstones.co.uk`. If that is not the live address, replace it in `content.md` before publishing.
