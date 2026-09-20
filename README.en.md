<div align="center">

# Onlynn

> A card-style blog theme for Halo 2
>
> Built on top of [Ethereal](https://github.com/AloneNanNan/halo-theme-ethereal),
> with appearance and interaction customisation modelled on
> [Firefly](https://github.com/CuteLeaf/Firefly)
>
> ![Halo](https://img.shields.io/badge/Halo-%3E%3D2.25.0-blue)
> ![Node.js >= 22.12](https://img.shields.io/badge/node.js-%3E%3D22.12-brightgreen)
> ![pnpm >= 10](https://img.shields.io/badge/pnpm-%3E%3D10-blue)
> ![Astro](https://img.shields.io/badge/Astro-7-orange)
> ![License](https://img.shields.io/badge/license-MIT-green)
>
> [![Stars](https://img.shields.io/github/stars/only1nn/halo-theme-Onlynn?style=social)](https://github.com/only1nn/halo-theme-Onlynn/stargazers)
> [![Issues](https://img.shields.io/github/issues/only1nn/halo-theme-Onlynn)](https://github.com/only1nn/halo-theme-Onlynn/issues)

</div>

---

📖 README:
**[简体中文](README.md)** | **[English](README.en.md)**

🚀 Quick links:
[**⬇️ Download**](https://github.com/only1nn/halo-theme-Onlynn/releases) /
[**🐛 Report an issue**](https://github.com/only1nn/halo-theme-Onlynn/issues) /
[**💬 Discussions**](https://github.com/only1nn/halo-theme-Onlynn/discussions)

✨ **Works out of the box**: one zip into Halo — everything else is configured from the
admin UI, no code changes needed

🎨 **Customisable appearance**: four wallpaper modes, light/dark, theme hue, falling
sakura, card borders — all toggleable from the settings

🧩 **Plugin friendly**: "enhance when present, degrade when absent" — a missing plugin
never breaks a page

📱 **Mobile-focused**: bottom navigation bar, drawer menu, mobile table-of-contents popup

<table width="100%" align="center">
  <tr>
    <td align="center"><img src="./screenshot/home.png" alt="Home page"><br>Home</td>
  </tr>
  <tr>
    <td align="center"><img src="./screenshot/post.png" alt="Post page"><br>Post page (word count, reading time, code blocks)</td>
  </tr>
</table>

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Theme settings](#theme-settings)
- [Plugin compatibility](#plugin-compatibility)
- [Building from source](#building-from-source)
- [Directory structure](#directory-structure)
- [Template pitfalls](#template-pitfalls)
- [Credits and license](#credits-and-license)

---

## Features

### Layout and appearance

- **Four wallpaper modes**: off / banner / fullscreen / fullscreen-transparent — visitors
  can switch, the admin sets the default
- **Two fullscreen layouts**: Classic (wallpaper scrolls with the page) and Hero (first
  screen pinned to the viewport, content scrolls over it, title fades out and wallpaper
  blurs progressively as you scroll)
- **Sidebar position**: the widget sidebar can sit on the left or the right — in a
  two-column layout it swaps with the content, in a three-column layout it swaps with the
  right column; the content always stays centred
- **Two- or three-column layouts**, optional category navigation bar
- **Card styling**: borders and soft shadows, card tint following the theme hue, hover
  lift, frosted-glass navbar
- **Light/dark mode** (4 switch animations) with an adjustable theme hue
- **Gradient transition** between the wallpaper and the page background, so the seam
  disappears
- Four animation-speed presets, refinable down to eight duration variables

### Reading experience

- **Focus mode**: one click hides the navbar, both sidebars, the table of contents and the
  floating buttons, and narrows the article into a centred single column. Exit with the
  always-visible button or `Esc`; the state persists across pages
- **Word count and reading time**: CJK characters counted per character, everything else
  per word (mixed Chinese/English posts are badly mis-estimated by either alone), at
  400 CJK characters or 200 words per minute
- **Related posts**: by shared category, falling back to shared tag; the current post is
  filtered out, and the block hides itself when there is nothing to recommend
- **Table of contents**: sidebar / right column, plus a mobile popup
- Previous/next post, license card, pinned-post highlight, share poster (with QR code),
  tip jar
- **Enhanced code blocks**: language badge, line numbers, auto-collapse for long blocks,
  one-click copy; visually aligned with Firefly (grey title bar with three muted dots,
  one-light / one-dark-pro Shiki themes)

### Motion and effects

- **Sakura effect**: petals drifting across the screen, drawn procedurally (no bundled
  image assets of unclear provenance), up to 100 petals, respects
  `prefers-reduced-motion`, pauses when the page is hidden
- **Wave at the banner footer**, gradient transition, wallpaper carousel
- **Mobile bottom navigation**: a fixed bar whose items (home / archives / categories /
  tags / search / top) are individually configurable; the page reserves space for it and
  floating buttons shift up to avoid it

### Sidebar widgets

Announcement, profile (with online status), weather, music player, Hitokoto, site stats
(9 optional entries), categories, tags, popular posts, **writing heatmap** (posting
density over the last six months, tinted with the theme hue), custom HTML, schedule,
table of contents

### Standalone pages

- **RSS subscription page**: feed URL (one-click copy with inline feedback), recommended
  readers, latest posts, and an explainer
- Page templates for the Moments, Timeline, Skills and Wishes plugins

### Site and ecosystem

- **Homepage social links**: a row of buttons under the title (GitHub / email / tip / RSS);
  each one appears only when filled in
- **Site uptime in the footer**: "running for X days HH:MM:SS", ticking every second,
  clickable
- **Search**: calls Halo's search-index API directly, with live results in the panel
- **Comments**: integrates with Halo's comment plugin
- **Friend links**: application flow, random visit, collapsible panels, footer card wall,
  moments feed
- **Visitor customisation**: the navbar "display settings" panel lets visitors switch
  layout, colour, wallpaper and effects. The admin can retract all of it with a single
  master switch — the entry disappears and everyone sees exactly what you configured
- Image CDN compression on the fly (8+ host rules), external-link warning
- Auth pages (sign in / sign up), configurable menu icons
- Localisation: Simplified Chinese / Traditional Chinese / English

## Requirements

| Dependency | Version |
| --- | --- |
| Halo | >= 2.25.0 |
| Node.js (only for development) | >= 22.12.0 (24.x recommended, see `.nvmrc`) |
| pnpm (only for development) | >= 10 |

## Installation

1. Download the latest `onlynn-<version>.zip` from
   [Releases](https://github.com/only1nn/halo-theme-Onlynn/releases)
2. In the Halo admin, go to Appearance → Themes → Install (top right) and upload the zip
3. Activate the theme
4. Open Themes → Settings and configure as needed (most features are off by default)

> The theme ID is `onlynn` (Halo requires lowercase IDs); the display name is **Onlynn**.

## Theme settings

The settings page is organised into 10 groups. The ones you will touch most:

| Group | What it configures |
| --- | --- |
| **Layout** | Page layout (two/three column), mobile bottom bar, banner mode, post card layout, menu bar, floating buttons, welcome popup |
| **Style** | **Display settings panel** (visitor permissions + defaults), banner and wallpaper, title and subtitle, homepage social links, colour scheme, language, style switches, sakura, animation speed, external fonts |
| **Sidebar** | Which widgets go in the left and right columns, plus per-widget options |
| **Post** | License card, related posts, article meta (word count / reading time), code blocks, content display, TOC, excerpt, action bar (including focus mode) |
| **Extra pages** | Moments, timeline, skills, RSS subscription page |
| **Footer** | Site uptime, ICP/PSB filing info, links, custom links, footer friend links |

> **Style → Display settings panel is the single place for appearance configuration.**
> The upper half controls what visitors may change; the lower half holds the defaults for
> those controls. To make every visitor see the same style, turn off the "allow visitors
> to switch styles" master switch — the front-end entry disappears and no per-browser
> state exists any more.

## Plugin compatibility

The theme enhances what is installed and degrades gracefully when it is not: a missing
plugin simply skips its module instead of erroring.

Deeply integrated plugins:

| Plugin | Purpose |
| --- | --- |
| Search | Navbar search panel (Halo search-index API) |
| Comments | Comment areas on posts, pages, moments and photos |
| Moments | Moments list and detail pages |
| Photos | Photo albums (PhotoSwipe lightbox + EXIF) |
| Links | Friend-link page, application flow, footer card wall, moments feed |
| Projects | Portfolio list and detail |
| Equipments | Equipment showcase page |
| Wishes | Wish wall / message wall |
| Schedule calendar | Schedule page and sidebar widget |
| Bilibili bangumi | Anime list page |
| extra-api | Site-wide word count |

Recommended alongside: **Feed** (RSS), **Sitemap**, **Shiki** (syntax highlighting),
**lightgallery**.

> **Shiki plugin tip**: set Style to `simple`, Light theme to `one-light` and Dark theme
> to `one-dark-pro` to match the code-block frame the theme provides. The `mac` style
> ships its own title bar and would duplicate it.

## Building from source

```bash
git clone https://github.com/only1nn/halo-theme-Onlynn.git
cd halo-theme-Onlynn
pnpm install
pnpm build     # produces dist/onlynn-<version>.zip
```

Other commands:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Watch `src/` and rebuild (no zip) |
| `pnpm build` | Full build plus package an installable zip |
| `pnpm verify` | Identity consistency check (theme / setting / asset-prefix names) |
| `pnpm check` | Type check |

## Directory structure

```
├── theme.yaml              theme manifest
├── settings.yaml           admin settings form
├── annotation-setting.yaml extra icon field for Halo menu items
├── i18n/                   UI strings (default / zh_CN / zh_TW, key order must match)
├── public/                 static assets, copied verbatim into templates/
│   ├── fragments/          Halo page fragments
│   ├── gateway_fragments/  auth page shell
│   └── assets/             compiled classic scripts (do not edit by hand)
├── scripts/
│   ├── build-assets.mjs        esbuild: src/scripts/assets/*.ts → public/assets/
│   ├── strip-html-comments.mjs strips comments from build output
│   ├── package-theme.mjs       packages the uploadable zip
│   ├── convert-readme.mjs      README → README-Halo.md
│   └── check-identity.mjs      theme identity consistency check
├── src/
│   ├── components/         UI components (layout / widget / control / pages …)
│   ├── layouts/            Layout.astro and MainGridLayout.astro
│   ├── pages/              one file per Halo template
│   ├── scripts/            classic script sources (compiled into public/assets/)
│   ├── styles/             Tailwind entry and per-module styles
│   └── utils/              client-side and shared logic
└── templates/              build output (Halo's template dir, not committed)
```

## Template pitfalls

This project compiles Astro into Thymeleaf templates, so two mental models meet and it is
easy to trip. Read `AGENTS.md` before editing templates; the most common traps:

- **`th:if` (precedence 300) runs before `th:with` (400)**: putting `th:with="x=…"` and a
  `th:if` that reads `x` on the same element means `x` does not exist yet, and the whole
  block silently renders nothing. Wrap it in an outer `<div th:remove="tag">` that carries
  the `th:with`, and put the condition on the inner element.
- **Astro scopes `<style>` by default**: nodes created at runtime with
  `document.createElement` carry no scope attribute, so scoped selectors never match and
  the styling silently does nothing. Use `<style is:global>` plus a container prefix.
- **Panel defaults must be server-rendered**: the first-frame script only applies visitor
  overrides. If a default exists only in that script, turning the visitor switch off drops
  the element back to its raw CSS default and the admin's configuration is lost.
- **`pnpm build` only compiles the Astro side** — it cannot see Thymeleaf server-side
  errors. Install the theme into Halo and load a page after changing templates.

## Credits and license

Onlynn stands on the shoulders of several open-source projects:

- [**Fuwari**](https://github.com/saicaca/fuwari) — the original Astro theme that defined
  the whole design language
- [**halo-theme-fuwari**](https://github.com/jiewenhuang/halo-theme-fuwari) — Fuwari's Halo
  port, which proved the "Astro compiles to Thymeleaf" pipeline
- [**Ethereal**](https://github.com/AloneNanNan/halo-theme-ethereal) — **the direct base of
  this project**, supplying most of the features and the Halo ecosystem integration
- [**Firefly**](https://github.com/CuteLeaf/Firefly) — the design reference; several
  appearance features here (Hero layout, sakura, code-block styling) are modelled on it

Distributed under the [MIT license](LICENSE). If you reference or reuse components from
this project, please credit it.
