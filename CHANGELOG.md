# Changelog

All notable changes to Weborg. Versions follow
[Semantic Versioning](https://semver.org).

## 0.2.3

### Changed

- First build submitted to the public Firefox Add-ons store. No feature
  changes: built from the npm lockfile so Mozilla's reviewers can rebuild
  it exactly from the source code.

## 0.2.2

### Changed

- Softer, more natural shadows in both themes: link tiles, the Quick
  Links tabs panel, popovers and the Todoist view menu use faint layered
  shadows, tinted for light and dark.
- The tabs panel's shadow now falls only below it, so folder tabs and
  the open panel read as one shape.

## 0.2.1

### Changed

- Settings and the README show Ko-fi's official "Buy me a coffee"
  button. In the extension it is bundled, so settings still contact no
  other site.

## 0.2.0: first public release

Install locally from GitHub; see the README. Chrome Web Store and Firefox
Add-ons listings are coming soon.

### Added

- **Todoist widget:** connect with your API token; Todoist views (Inbox,
  Today, Next 7 days, Upcoming, projects, labels, custom filters) with
  Overdue sections; Quick Add with live syntax highlighting; full task
  form (description, labels, project, priority, due date); edit, complete
  and delete; task details in place; hide tasks with the eye button.
- **Light, dark and system themes**, with a switch in the bottom-right
  corner.
- **Dynamic backgrounds** with dark and light versions that follow the
  theme (16 presets, the new default), more colour and gradient presets,
  and separate images per theme.
- **Readable text everywhere:** text on the background turns white or
  dark based on the background's brightness.
- **Optional passwords** to unlock the page and to show hidden tasks
  (the Weborg password or a separate one).
- **About footer** in settings, with source code and Ko-fi links.
- New extension icon.

### Changed

- Stronger keyboard focus ring and a clearer open tab in Quick Links.
- A hint in the + popover that it also creates folders.

## 0.1.0

- Initial development build: clock, greeting, search, quick links,
  notes and text widgets; backgrounds; appearance settings; lock and
  hide widgets; backup and restore.
