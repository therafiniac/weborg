# Firefox Add-ons (AMO) listing

Copy for the AMO submission form. Keep in sync with the README.

## Files

- **Add-on:** `.output/weborg-<version>-firefox.zip` (`npm run zip:firefox`)
- **Source code:** `.output/weborg-<version>-sources.zip` (same command).
  Required because the code is bundled.
- **Platforms:** Firefox (desktop) only. Firefox for Android cannot replace
  the new tab page.

## Listing

**Name:** Weborg

**Summary** (max 250 characters):

> A calm, customisable new tab page: widgets, quick links with folders and
> tabs, Todoist tasks, light and dark themes, and backgrounds that follow
> the theme. Free, open source, no tracking.

**Description:**

> Weborg turns your new tab into a calm, organised start page that you set
> up without writing code.
>
> • Widgets you place anywhere: clock, greeting, search, quick links,
> notes, text and Todoist
> • Quick links as tiles or plain links, with folders, tabs, drag to
> reorder and number keys 1–9
> • Todoist: see, add, edit, complete and delete tasks, with Todoist's
> views (Inbox, Today, Next 7 days, Upcoming, projects, labels) and Quick
> Add syntax
> • Light, dark or system theme, with a one-click switch
> • Dynamic backgrounds that change with the theme, plus colours, gradients
> or your own images (one per theme if you like)
> • Text that stays readable on any background
> • Privacy tools: hide widgets or tasks, lock the page, optional password
> • Fonts, sizes, colours and spacing, globally or per widget
> • Backup and restore your settings
>
> Privacy: everything stays in your browser. No accounts, no analytics.
> Weborg only contacts another site for features you turn on: your search
> engine when you search, website icons (optional, off by default) and
> Todoist after you connect it.
>
> Open source (MIT): https://github.com/therafiniac/weborg

**Categories:** Tabs; Appearance

**Tags:** new tab, start page, dashboard, todoist, productivity

**Homepage:** https://github.com/therafiniac/weborg

**Support site:** https://github.com/therafiniac/weborg/issues

**Licence:** MIT

**Contributions URL:** https://ko-fi.com/Q3C02B5R99

## Privacy policy

> Weborg does not collect, sell or share personal data, and has no
> servers of its own.
>
> Your settings, notes, links and images are stored only in your browser.
> Settings may sync between your own browsers through Firefox Sync if you
> use it; images, passwords and the Todoist token never sync.
>
> Weborg sends data to other services only for features you choose:
>
> - Search: your search goes to the search engine you picked, when you
>   search.
> - Website icons (off by default): each quick link's domain is sent to
>   icons.duckduckgo.com to fetch its icon.
> - Todoist (only after you connect it): your Todoist API token and task
>   data are exchanged with api.todoist.com to show and change your tasks.
>   Todoist's own privacy policy applies to that data.
>
> Optional passwords are stored only as salted one-way hashes on your
> device. Removing the extension deletes all of its data.
>
> Questions: https://github.com/therafiniac/weborg/issues

## Notes to reviewer

> Build: Node.js 20+ (tested with Node 24, npm 11). In the source folder
> run `npm ci`, then `npm run zip:firefox`. The add-on is written to
> `.output/weborg-<version>-firefox.zip`; `.output/firefox-mv3/` holds the
> unpacked build, identical to the uploaded add-on.
>
> - The two innerHTML warnings come from React DOM (bundled); Weborg's
>   own code does not use innerHTML or dangerouslySetInnerHTML.
> - No remote code: everything is bundled.
> - api.todoist.com is an optional host permission, requested together
>   with the optional `authenticationInfo` data-collection consent only
>   when the user connects the Todoist widget (Settings → Widgets →
>   Todoist). Testing it needs a Todoist account and its API token
>   (Todoist → Settings → Integrations → Developer); everything else works
>   without one.
> - Optional passwords use PBKDF2-SHA256 (600,000 iterations) via Web
>   Crypto, stored locally.
