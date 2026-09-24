<div align="center">

# Onlynn

> A card-style blog theme for Halo 2
>
> Base styling from [Fuwari](https://github.com/saicaca/fuwari), ported to Halo,
> with appearance and interaction customisation modelled on
> [Firefly](https://github.com/CuteLeaf/Firefly)
>
> ![Version](https://img.shields.io/badge/version-1.1.0-blue)
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
- [Menus and paths](#menus-and-paths)
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
- **Two fullscreen layouts**: Classic (wallpaper scrolls with the page) and Hero (the
  wallpaper is pinned as a full-screen background, the first screen scrolls up over it and
  the title fades as you scroll). **Hero applies to every page** — inner pages keep their
  wallpaper permanently blurred by a configurable amount so the content floating on top
  stays readable
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
- **Post heat ℃**: a heat score of `24 + views×0.1 + likes×2 + comments×3`, colour-coded in
  three tiers (the hotter, the warmer). Shown on both list cards and the post page, using the
  visit / like / comment figures Halo already tracks
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
- **Comment danmaku**: turns that page's existing comments into capsules scrolling right
  to left. On the guestbook it lives inside the "guestbook" welcome card (below the
  welcome line, separated by a dashed rule); on posts it gets its own card.
  It reads Halo's public comment API
  (never scrapes the comment DOM, so a plugin upgrade cannot break it), the capsules
  follow your theme colour in both light and dark mode, and the site owner's own
  comments get their own highlight. Hovering pauses, clicking scrolls to the comments.
  Requires a comment plugin (see "Plugin compatibility")
- **Subtitle typewriter**: multiple lines rotate; the "typewriter backspace" switch decides
  whether it erases and retypes (looping) or stops once typed
- **Cursor style**: **14 built-in cursor sets** (OwO / UwU / breeze / mellow / rainbow water
  drops ×2 / rainbow pony / coloured shards / Overwatch / rainbow rain / Sakura Majo /
  black cat / music cat ×2), each covering pointer / hand / text / zoom; or upload your own
  cursor files (fill in as many states as you like — empty ones fall back to the system
  cursor). The assets come from Dream2.0 Plus; see `public/assets/cursors/SOURCES.md` for
  provenance and what was left out
- **Cursor effects**: the same option set as Dream2.0 Plus — 8 pointer-move effects (bubble /
  emoji / springy emoji / fairy dust / snowflake / following dot / ghost trail (sparse) /
  trailing cursor (dense)) + 4 click effects (firework / particle explosion / word drop /
  hearts), plus opacity and a mobile switch
- **Off-screen title text**: when the tab goes to the background, the title is swapped for
  your "away" text; on return an "back" text is shown briefly before the original title is
  restored. The dwell time is configurable, and the original title is refreshed on page
  navigation so a stale title is never written back
- **Grayscale mode**: desaturate the whole site over date ranges for days of mourning —
  multiple ranges and ranges crossing new year (e.g. `12/30~01/02`) are supported. Decided on
  the first frame, so there is no colour flash before it turns grey
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
- **Sponsor page**: intro copy, ways to support (WeChat / Alipay QR codes, or outbound
  links such as Afdian / ko-fi) and a supporter list (name / amount / date / avatar, can
  be switched off entirely). Everything is maintained in the admin; the page is fully
  server-rendered
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
- **Footer link columns**: a multi-column link block (Navigation / Organisation / Legal /
  Friends and so on) whose titles and links are all configurable, reusing Halo menus so
  ordering and nesting are edited in the menu editor
- **Visitor customisation**: the navbar "display settings" panel lets visitors switch
  layout, colour, wallpaper and effects. The admin can retract all of it with a single
  master switch — the entry disappears and everyone sees exactly what you configured
- Image CDN compression on the fly (8+ host rules), external-link warning
- Auth pages (sign in / sign up), configurable menu icons
- Localisation: Simplified Chinese / Traditional Chinese / English

## Requirements

| Dependency                     | Version                                     |
| ------------------------------ | ------------------------------------------- |
| Halo                           | >= 2.25.0                                   |
| Node.js (only for development) | >= 22.12.0 (24.x recommended, see `.nvmrc`) |
| pnpm (only for development)    | >= 10                                       |

## Installation

1. Download the latest `onlynn-<version>.zip` from
   [Releases](https://github.com/only1nn/halo-theme-Onlynn/releases)
2. In the Halo admin, go to Appearance → Themes → Install (top right) and upload the zip
3. Activate the theme
4. Open Themes → Settings and configure as needed (most features are off by default)

> The theme ID is `onlynn` (Halo requires lowercase IDs); the display name is **Onlynn**.

## Theme settings

The settings page is organised into 11 groups. The ones you will touch most:

| Group            | What it configures                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**       | Page layout (two/three column), mobile bottom bar, banner mode, post card layout, menu bar, floating buttons, welcome popup                                                                                                     |
| **Style**        | **Display settings panel** (visitor permissions + defaults), banner and wallpaper, title and subtitle, homepage social links, colour scheme, language, style switches, sakura, comment danmaku, animation speed, external fonts |
| **Sidebar**      | Which widgets go in the left and right columns, plus per-widget options                                                                                                                                                         |
| **Post**         | License card, related posts, article meta (word count / reading time / heat), code blocks, content display, TOC, excerpt, action bar (including focus mode)                                                                     |
| **Extra pages**  | Moments, timeline, skills, RSS subscription page, sponsor page                                                                                                                                                                  |
| **Footer**       | Site uptime, ICP/PSB filing info, links, custom links, footer friend links, footer link columns                                                                                                                                 |
| **Enhancements** | Off-screen title text, cursor style, cursor effects, grayscale mode                                                                                                                                                             |

> **Style → Display settings panel is the single place for appearance configuration.**
> The upper half controls what visitors may change; the lower half holds the defaults for
> those controls. To make every visitor see the same style, turn off the "allow visitors
> to switch styles" master switch — the front-end entry disappears and no per-browser
> state exists any more.

### Comment danmaku options

Everything under Style → Comment danmaku:

| Field           | Default            | Notes                                                                                                                                                                                                         |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enable          | off                | Master switch. When off the stage is not rendered and `danmaku.js` is not even downloaded                                                                                                                     |
| Scope           | Guestbook only     | Guestbook only / posts only / every page with comments                                                                                                                                                        |
| Scroll duration | 14                 | Seconds for one capsule to cross the stage; smaller is faster. Every capsule moves at the same speed, so long comments do not overtake short ones                                                             |
| Lanes           | 5                  | How many rows to scroll in. Halved on narrow screens; if the stage is too short for the lanes you asked for, the count is lowered further so capsules never stack                                             |
| Minimum gap     | 24                 | Least number of pixels between two capsules in the same lane                                                                                                                                                  |
| Opacity         | 0.9                | Capsule opacity                                                                                                                                                                                               |
| Show avatar     | on                 | Uses the avatar when there is one; email guests have none, so the first character of their name is used with a colour derived from a hash of that name                                                        |
| Max items       | 30                 | Takes the most recent N comments, newest first                                                                                                                                                                |
| Stage height    | 180                | Pixels — only needs to fit the number of lanes                                                                                                                                                                |
| Loop            | on                 | Restarts after the last comment so the stage never sits empty                                                                                                                                                 |
| Click action    | Scroll to comments | A comment plugin's per-comment anchors live inside its own shadow root and are not portable across providers, so by default a click just scrolls to the comment section. Can also be set to no click reaction |

Visitors can toggle it themselves under Display settings → Effects, provided
"Visitor-adjustable style → Comment danmaku" is on.

### Cursor style and cursor effects

Both live under the Enhancements group. They are independent — you can enable either alone.

**Cursor style**: one dropdown — 14 built-in sets, plus "off" and "upload your own".

| Option  | Notes                                                                                       |
| ------- | ------------------------------------------------------------------------------------------- |
| Off     | Use the system cursors                                                                      |
| 14 sets | Each covers pointer / hand / text / zoom; a few use different files per state (as upstream) |
| Upload  | Your own cursor files, one slot per state; states left empty fall back to the system cursor |

> **Provenance**: these `.cur` files come from the Dream2.0 Plus asset pack, which carries no
> attribution for them. The theme ships only the 37 files that pack actually references
> (~205 KB); the 50 unreferenced `.ani` files (~1.7 MB) were left behind. The provenance note
> and the per-set file table live in `public/assets/cursors/SOURCES.md`.
> Uploaded `.cur` / `.ani` files carry their own hotspot; for `.png` / `.svg` set the hotspot
> offsets below. Has no effect on touch devices.

**Cursor effects** (same options as the reference theme):

| Field               | Notes                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Pointer-move effect | Off / bubble / emoji / springy emoji / fairy dust / snowflake / following dot / ghost trail (sparse) / trailing cursor (dense) |
| Click effect        | Off / firework / particle explosion / word drop / hearts (the last two have editable lists)                                    |
| Opacity             | Lower it to make the effects subtler; 1 is fully opaque                                                                        |
| Show on mobile      | Off by default on touch devices, so a finger drag does not fill the screen with particles                                      |

> **Off means no download**: when both effects are set to "off", `cursor-fx.js` is not
> included at all. Even when enabled it stays inert if the system preference is
> "reduce motion", or on a touch device with "show on mobile" off. At runtime it does not
> idle either: the frame loop stops once no particles are left, follower effects stop
> scheduling frames once the pointer settles, it pauses while the tab is hidden, and
> particle counts have hard caps (move ≤150, ≤60 per click, ≤300 total).

### Sponsor page options

Everything under Extra pages → Sponsor page:

| Field               | Notes                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subtitle            | Shown under the page title; falls back to the default copy                                                                                                |
| Intro copy          | The lead paragraph; falls back to the default copy                                                                                                        |
| Where it goes       | What the money is used for; leave empty to hide the block                                                                                                 |
| Support methods     | One card each. **A QR image shows the code; a URL alone shows a "Support now" button** (QR wins when both are set). A method with neither is not rendered |
| Show supporter list | Turn off to hide the whole block                                                                                                                          |
| Supporter list      | Per row: name / amount / date / avatar. Name it "匿名" to stay anonymous; without an avatar the first character of the name is used                       |
| Closing thanks      | Shown under the supporter list; leave empty to hide                                                                                                       |

Leaving a method's **icon** empty matches it by name: WeChat / Alipay get brand icons,
names containing 发电 get a hand-holding-heart, ko-fi gets a coffee cup, everything else a
heart — or pick one yourself from the icon picker.

> When no method is configured at all the page shows a short "no support methods yet"
> note instead of leaving an empty grid.

## Menus and paths

When creating a menu item in Halo's admin (Appearance → Menus), **just put the path in the
"Link" field** (e.g. `/archives`) — Halo prepends your site domain. A full external URL
(`https://example.com`) also works; tick "open in new window" for those. Menu items can
carry an Iconify icon too (the theme registers the menu annotation, so the field appears
in the menu item form).

### The footer link columns reuse menus too

The multi-column link block under Theme settings → Footer → Footer link columns reads a
**Halo menu** rather than keeping a second list of its own:

1. Create a menu under Appearance → Menus (call it "Footer", say)
2. Put the **column titles** in as top-level items (Navigation, Legal, Friends …) — their
   own link can be left blank
3. Add **children** under each top-level item; the children are the links that get shown
4. Back in Theme settings → Footer → Footer link columns: switch it on, pick that menu,
   choose how many columns per row; the optional Block title adds a centred heading above
   the columns (same style as the footer friend-links heading)

Ordering, nesting and icons are then all maintained in Halo's own menu editor. A top-level
item with no children falls back to showing itself as that column's only link, so you never
get an empty column — and deleting a top-level item removes the whole column.

Below is every reachable path the theme provides, grouped by where it comes from.

### 1. Built into the theme (available immediately)

| Menu name    | Link value           | Notes                                                |
| ------------ | -------------------- | ---------------------------------------------------- |
| Home         | `/`                  | Site home                                            |
| Archives     | `/archives`          | All posts, newest first                              |
| Categories   | `/categories`        | Category overview                                    |
| Tags         | `/tags`              | Tag overview                                         |
| One category | `/categories/{slug}` | Replace `{slug}` with the category slug              |
| One tag      | `/tags/{slug}`       | Same as above                                        |
| One post     | `/archives/{slug}`   | A post's permalink                                   |
| Custom page  | `/{slug}`            | Create it under "Pages"; `{slug}` is the page's slug |

> The actual URLs follow the **permalink rules** in Settings → Post. The values above are
> the defaults (posts at `/archives/{slug}`, pages at `/{slug}`). If you changed the rules,
> use whatever the site actually serves.

### 2. Page templates the theme ships (create the page yourself)

Go to Pages → New, pick the template under **Advanced → Custom template**, and set the
slug to the suggested value:

| Template                        | Suggested slug | Notes                                                                                                   |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| **留言板 / Guestbook**          | `guestbook`    | Centred intro card plus the comment area; leave the page body empty or write your own welcome text      |
| **RSS 订阅 / RSS subscription** | `rss`          | Feed URL with one-click copy, recommended readers, latest posts                                         |
| **朋友圈 / Moments feed**       | `friends`      | Needs the Links plugin                                                                                  |
| **心愿便签 / Wishes**           | `wishes`       | Needs the Wishes plugin                                                                                 |
| **时间轴 / Timeline**           | `timeline`     | Data configured in the theme settings                                                                   |
| **技能 / Skills**               | `skills`       | Data configured in the theme settings                                                                   |
| **打赏支持 / Sponsor**          | `sponsor`      | Support methods (QR codes / outbound links) and a supporter list; data configured in the theme settings |

> The slug is up to you (you could serve the RSS page at `/feed`); the values above are
> just suggestions. The theme's homepage RSS button points at `/rss` by default — update
> it if you pick a different slug. Once the sponsor page exists, put its URL into
> Style → Homepage social links → Sponsor page so the entry shows up under the homepage
> subtitle.

### 3. Paths provided by plugins (only when installed)

| Plugin            | Link value           | Notes                                       |
| ----------------- | -------------------- | ------------------------------------------- |
| Moments           | `/moments`           | List; `/moments/{name}` is the detail page  |
| Photos            | `/photos`            | List; `/photos/{name}` is the detail page   |
| Links             | `/links`             | Friend links; `?group=` filters by group    |
| Bilibili bangumi  | `/bangumis`          | Anime list                                  |
| Schedule calendar | `/schedule-calendar` | Schedule page                               |
| Equipments        | `/equipments`        | Equipment showcase; `?group=` filters       |
| Projects          | `/projects`          | List; `/projects/{slug}` is the detail page |

The theme already adapts every template above, so installing the plugin is enough.

### Auth pages (built into Halo)

`/login`, `/signup`, `/logout`, `/password-reset`. You normally do not need these in a
menu — the theme redirects to them when required.

### Not supported yet

**Author archive** (`/authors/{name}`): the theme ships no `author.html`, so this returns 404. It is inherited from the base theme (upstream does not have it either). Category and
tag archives both work.

## Plugin compatibility

The theme enhances what is installed and degrades gracefully when it is not: a missing
plugin simply skips its module instead of erroring.

Deeply integrated plugins:

| Plugin            | Purpose                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Search            | Navbar search panel (Halo search-index API)                                                        |
| Comments          | Comment areas on posts, pages, moments and photos                                                  |
| Moments           | Moments list and detail pages                                                                      |
| Photos            | Photo albums (PhotoSwipe lightbox + EXIF)                                                          |
| Links             | Friend-link page (own info has a one-click copy), application flow, footer card wall, moments feed |
| Projects          | Portfolio list and detail                                                                          |
| Equipments        | Equipment showcase page                                                                            |
| Wishes            | Wish wall / message wall                                                                           |
| Schedule calendar | Schedule page and sidebar widget                                                                   |
| Bilibili bangumi  | Anime list page                                                                                    |
| extra-api         | Site-wide word count                                                                               |

Recommended alongside: **Feed** (RSS), **Sitemap**, **Shiki** (syntax highlighting),
**lightgallery**.

> **The danmaku does not depend on a comment plugin.** It reads Halo's public comment API
> only; the `haloCommentEnabled` theme variable (true only when a plugin implements the
> `CommentWidget` extension point) is irrelevant to it. With a plugin that brings its own
> UI the comment section may not render while the danmaku keeps working. As long as there
> are comments in the database, the master switch under Style → Comment danmaku is on and
> the page matches the configured scope, the danmaku appears — and it collapses by itself
> when a page has no comments.

### Aligning plugin CSS variables

A few official plugins expose CSS variables, but their defaults belong to the plugin's own
design language, so an installed plugin tends to look like a foreign body. The theme maps
those variables onto its own palette and radii, so plugin pages stop breaking the colour
scheme. **Pure CSS, no script:**

| Plugin                | What is aligned                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Search widget         | Primary / body text / muted text / modal and overlay backgrounds / dividers / kbd hints / radius / font     |
| Editor hyperlink card | Title and description text / inline background and hover / border and hover border / link colour / skeleton |

The variable names were checked one by one against each plugin's published source and live in
`src/styles/plugin-vars.css`. Only the sets that could be verified are included — for plugins
with no public source (contact form, article subscription) nothing was written rather than
guessing at variable names. Fonts are aligned with `inherit`, so plugins follow along when you
switch the theme's custom font.

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

| Command       | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| `pnpm dev`    | Watch `src/` and rebuild (no zip)                                 |
| `pnpm build`  | Full build plus package an installable zip                        |
| `pnpm verify` | Identity consistency check (theme / setting / asset-prefix names) |
| `pnpm check`  | Type check                                                        |

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

- [**Fuwari**](https://github.com/saicaca/fuwari) — **the styling base of this project**:
  the card layout, palette and typographic rhythm all come from it. This theme ports it to
  Halo, keeping the same "Astro compiles to Thymeleaf" pipeline
- [**Firefly**](https://github.com/CuteLeaf/Firefly) — the design reference: on top of the
  Fuwari base, the Hero layout, sakura and code-block styling here follow its aesthetics
- [**Halo**](https://halo.run) — the platform itself; the templating system, settings
  framework and plugin ecosystem all rest on it

Distributed under the [MIT license](LICENSE). If you reference or reuse components from
this project, please credit it.
