# Project Loading Delay Report

## Summary

The biggest perceived delay is not the project query itself. The page is intentionally covered by the global intro overlay for about **2.15 seconds** on every page load:

* `components/page-intro.tsx`
* `HOLD_MS = 1400`
* `EXIT_DURATION = 0.75`

That means even if `/projects` or `/projects/[id]` is ready, the user still sees the intro before the page becomes usable.

## Main Delay Sources

### 1. Global intro overlay

`PageIntro` is rendered in `app/layout.tsx`, so it runs for every page, including project listing and project detail pages.

Impact:

* Blocks the whole UI with `z-[9999]`.
* Adds about `1400ms + 750ms = 2150ms` of visible wait.
* Makes project loading feel slow even when data is already prerendered or cached.

Recommendation:

* Show the intro only on first visit using `sessionStorage`.
* Or reduce it to around `400-700ms`.
* Or disable it on `/projects` and `/projects/[id]`.

### 2. Project detail page does two database reads

`app/projects/[id]/page.tsx` first calls:

* `getProjectById(id)`

Then it calls:

* `getProjects(eq(projectsTable.is_public, true))`

The second call loads all public projects with tags and participants just to create the “related projects” list.

Impact:

* More DB work than needed.
* More data transferred/server-rendered than needed.
* Slower detail pages as the project count grows.

Recommendation:

* Add a dedicated query for related projects with a `limit 3`.
* Do not load participants for related cards unless the card needs them.

### 3. Project list sends all project data to a client component

`app/projects/page.tsx` fetches all public projects and passes them to `components/projects-search.tsx`.

`ProjectsSearch` is a client component and builds a Fuse index in the browser.

Impact:

* Larger hydration payload.
* Client CPU work before search/filtering is ready.
* The cost grows with project count, tags, and participant data.

Recommendation:

* For the listing page, fetch only fields needed by `ProjectCard` and search.
* Avoid including participants on the listing page.
* Consider server-side search/filtering if the dataset grows.

### 4. `getProjects` always includes tags and participants

`db/queries.ts` currently does:

```TypeScript
with: { tags: true, participants: true }
```

Impact:

* Good for detail pages.
* Wasteful for listing pages and related-project cards.

Recommendation:

* Split into multiple query helpers:
  * `getProjectByIdWithDetails`
  * `getProjectsForCards`
  * `getRelatedProjects`

### 5. Large images can delay visual completion

Project cards and detail pages use remote R2 images through `next/image`.

Impact:

* The HTML may load, but the page can still feel incomplete while images resolve.
* Detail page hero image uses `priority`, which is correct, but remote image optimization still depends on image size and network.

Recommendation:

* Keep `priority` only for the main detail image.
* Ensure card images are reasonably sized/compressed.
* Consider blur placeholders or dominant color placeholders for perceived speed.

### 6. Notification initialization runs globally

`NotificationProvider` runs in `app/layout.tsx` and registers the service worker / checks push subscription on load.

Impact:

* Usually not the main blocker because it runs in effects after hydration.
* Still adds global client work on every page.

Recommendation:

* Keep it, but avoid making visible layout depend on it.
* Current dynamic banner slot helps reduce server-side impact.

## Static Prerendering Notes

The project routes use cache-friendly patterns:

* `/projects` uses `"use cache"`, `cacheLife("days")`, and `cacheTag("projects")`.
* `/projects/[id]` uses `generateStaticParams()`.

This is good for static prerendering. The main issue is that extra data is being fetched and then sent into client components.

Best fit:

* Keep static prerendering for project pages.
* Add narrower DB queries to reduce payload.
* Use Suspense only around data sections that can stream independently.
* Keep client components for search UI, but reduce the amount of data passed into them.

## Priority Fix List

1. Make `PageIntro` first-visit-only or disable it for project pages.
2. Split `getProjects` into smaller query helpers.
3. Replace related-project loading with a limited related query.
4. Send less data to `ProjectsSearch`.
5. Add placeholders or stronger image optimization for project cards.

## Expected Biggest Win

Changing the intro overlay is the fastest visible improvement. It can remove up to **2.15 seconds** of perceived loading delay without touching database logic.
