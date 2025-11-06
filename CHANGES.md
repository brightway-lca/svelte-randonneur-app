# Changelog

## 0.1.0 - 2025-10-29

- Landing page redesign:
  - Added header logo and "Data Browser" title with intro text and links
  - Added "Browse your data" (Upload Randonneur file) and "Browse example file" boxes
  - Reduced spacing; tightened layout; removed box borders; narrowed widths
- Switched custom diff algorithm to `diff` library (`diffWordsWithSpace`) with UUID-safe handling
- Added legend explaining diff colors/styles in section headers (Replace, Update, Disaggregate)
- Made left-hand navigation panel collapsible with persisted state
- Applied light green styling to SvelteUI buttons to match table headers
- Various UI polish and accessibility improvements
- Fixed up dark/light switch and listen to browser preferences
