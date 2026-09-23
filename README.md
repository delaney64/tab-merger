# Tab Merger

A minimal Chrome extension that merges all open Chrome windows into one with a single click, and keeps your tab groups organized.

## Features

- Merges all Chrome windows into a single window
- Keeps tab groups intact when merging
- Moves tab groups to the front, sorted A–Z by group name (unnamed groups go after named ones)
- Optional sorting for tabs: by domain, by title A–Z, or by most recent
  - The selected sort applies to tabs inside each group and to ungrouped tabs after the groups
- Pinned tabs are left untouched
- Displays confirmation with number of windows merged
- No data collection, no external requests

## Installation

### From the Chrome Web Store

[Install Tab Merger](https://chromewebstore.google.com/detail/tab-merger/fmihgbiodgihpohmpgnelcaamfmmdbbd)

### From Source

1. Clone this repo
   ```bash
   git clone https://github.com/delaney64/tab-merger.git
   ```
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `tab-merger` folder

## Usage

1. Click the **Tab Merger** icon in your Chrome toolbar
2. Pick a sort order (or leave it on **No sorting**)
3. Hit **Consolidate Tabs**

Resulting tab order: pinned tabs → tab groups (A–Z by name, unnamed last) → ungrouped tabs.

## Permissions

- `tabs` / `windows`: move tabs between windows and read titles/URLs for sorting
- `tabGroups`: read group names and move groups as a unit

## Contributing

PRs welcome. Keep it simple.

## License

MIT
