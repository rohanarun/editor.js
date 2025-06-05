# editor.js
A drop-in javascript library that adds AI and visual editors to any website or tool. 

Press the Alt key after loading this open source javascript to open AI prompt and visual code editors and add features to any website(Claude 3.7 ) . It stores the keys locally in your browser.

We use this to add a visual + prompt editor to any toy.new output without installing anything, allowing editing on the open web. Remove the library when you want to publish, use it to quickly iterate, or keep it to allow edits. 


Try it by pressing the Alt key on this website to add any features: https://cheatlayer.com/atlas/sbm7xoffo1_1749100880993.html


# ✨ Enhanced Inline Website Editor

![javascript](https://img.shields.io/badge/built_with-JavaScript-informational)

A zero-config, drop-in **WYSIWYG+AI** editor that lets you redesign any HTML page in two ways:

| Mode | What it does | How to start |
|------|--------------|--------------|
| **AI Prompt Mode** | Describe changes in plain English – the editor streams back a fully-updated HTML document via the [OpenRouter](https://openrouter.ai) chat API. | Press **Alt** → “AI Prompt Mode” tab → type prompt → **Apply Changes** |
| **Visual Mode** | Hover to highlight elements, click to edit text, styles or attributes in a side panel. | Press **Alt** → “Visual Editor” tab → **Start Visual Editing**, then close the modal |

---

## ✈️ Quick start

1. **Add the script** (or bundle it yourself):

```html
<script defer src="editor.js"></script>
```

2. **Grab a free OpenRouter key**  
   Sign up at <https://openrouter.ai/keys> and copy your key.

3. **Open your page** and press **Alt** – the editor overlay appears.  
   Your API key is stored in `localStorage` and never leaves the browser.

---

## Features

- **Live streaming updates** – watch the DOM morph as the model streams tokens  
- **Preserves site functionality** – script & style tags are kept intact  
- **Generate an entire web app** in a single prompt (HTML + CSS + JS)  
- **One-click deployment** to CheatLayer **LiveModeU** (optional)  
- **Fully themable** – tweak over 40 CSS variables (`--atlas-*`)  
- **Tiny public API** for programmatic control (see below)  
- No build step, no server, **just a `<script>` tag**

---

## Public API

After the script loads it exports `window.inlineEditor`:

| Method | Purpose |
|--------|---------|
| `show()` / `hide()` | Open or close the overlay programmatically |
| `isActive()` | `true` while the overlay is visible |
| `switchMode('prompt' \| 'visual')` | Toggle UI tabs |
| `selectElement(HTMLElement)` | Force-select an element in visual mode |
| `isStreaming()` | `true` while an AI response is in flight |
| `startVisual()` / `stopVisual()` | Manually enable/disable element highlighting |

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Alt** | Toggle the editor overlay |
| **Ctrl + Enter** | Send prompt (when cursor is in prompt box) |
| **Esc** | Stop visual editing / close overlay |
| **Alt** (while visual editing) | Jump back into the overlay |

