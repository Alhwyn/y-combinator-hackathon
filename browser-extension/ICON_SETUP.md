# Extension Icon Setup

The browser extension requires icon files. You have two options:

## Option 1: Use Emoji Icons (Quick & Easy)

Create simple emoji-based icons using online tools:

1. Visit https://favicon.io/favicon-generator/
2. Enter text: 🤖
3. Select background color: #667eea
4. Download the icons
5. Rename them to:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
6. Place in `browser-extension/` folder

## Option 2: Use Placeholder Images (For Testing)

Create solid color placeholders:

```bash
# macOS/Linux with ImageMagick
convert -size 16x16 xc:#667eea icon16.png
convert -size 48x48 xc:#667eea icon48.png
convert -size 128x128 xc:#667eea icon128.png
```

Or use online tools:

- https://png-pixel.com/ (create solid color PNGs)
- https://www.online-image-editor.com/

## Option 3: Design Custom Icons

Use design tools:

- Figma
- Sketch
- Adobe Illustrator
- Canva

Export as PNG in three sizes: 16x16, 48x48, 128x128

## Temporary Workaround

If you just want to test quickly, Chrome will work without icons (just shows a blank icon).
The extension will still function perfectly!

## After Adding Icons

1. Go to `chrome://extensions/`
2. Click reload icon on your extension
3. The new icon should appear
