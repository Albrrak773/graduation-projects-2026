# Mobile Image Scroll Performance Plan

## Problem

The live homepage at `https://graduation.gdg-q.com/` becomes very slow on phone scroll and can turn gray after scrolling. I reproduced the same rendered image structure locally at `http://localhost:3000/`.

The most likely cause is not only network loading. It is a combination of large project image decoding, many image-heavy cards on the homepage, and expensive mobile paint effects.

## Evidence From Live Site

* Live homepage response: `200`.
* Local dev homepage response: `200`.
* Live homepage renders `38` `<img>` tags in the initial HTML.
* `28` of those are remote project images from R2 inside homepage project cards.
* The local dev page renders the same `38` image tags, so the issue is present in the current project code too.
* A sampled project image is still `1,958,394` bytes when requested through Next image optimization at `w=384`, `w=640`, and `w=1200`.
* Other sampled R2 project images are large:
  * `907,460` bytes
  * `1,949,698` bytes
  * `2,427,116` bytes
  * `3,632,768` bytes

This is a warning sign. For project cards, a phone should usually download thumbnails around `40-180 KB`, not multi-megabyte images.

## Likely Root Cause

### 1. Project card images are too heavy for mobile scrolling

`components/project-card.tsx` uses:

```TSX
<Image
  src={project.image_url!}
  fill
  quality={60}
  sizes="(max-width: 640px) 272px, (max-width: 768px) 288px, 320px"
/>
```

The `sizes` value is reasonable, but the live optimizer is still returning huge payloads for sampled images. This can happen when source images are already WebP files that are very large, animated, or otherwise not being resized effectively by the optimizer.

Impact:

* Slow image decode on mobile CPU.
* High memory pressure after many cards.
* Scroll jank.
* Gray screen when the browser compositor gives up or reloads/paints a blank layer under memory pressure.

### 2. Homepage renders many off-screen project cards

`app/page.tsx` renders up to `10` cards per college section, across 3 colleges, plus previous projects and decorative images. On mobile, those horizontal rows are below the fold, but the DOM and images are still present.

### 3. Mobile paint effects are expensive

`app/globals.css` uses:

```CSS
background-attachment: fixed;
```

The page also uses several `backdrop-blur` layers, large shadows, fixed nav, gradients, and Framer Motion transforms. On mobile, `background-attachment: fixed` plus blur/transformed image layers is a known source of scroll jank.

### 4. Too many priority/preloaded images

`components/page-intro.tsx` and `components/hero.tsx` both mark large visual images as `priority`. The live HTML preloads repeated logo and pattern variants. This makes the first page heavier before the user can scroll.

## Recommended Fix

### Priority 1: Add real thumbnails for project cards

Do not use the original uploaded image in `ProjectCard`.

Add a dedicated thumbnail URL, for example:

* `image_url`: original/full image for detail page.
* `image_thumb_url`: compressed card image.

Recommended thumbnail format:

* Width: `480px` or `640px`.
* Format: WebP or AVIF.
* Quality: `60-70`.
* Strip metadata.
* Static image only, no animated WebP.
* Target size: ideally under `150 KB`.

Then update `ProjectCard` to use:

```TSX
src={project.image_thumb_url ?? project.image_url!}
```

This is the biggest fix.

### Priority 2: Batch-compress existing R2 images

Run a one-time batch job for current project images:

1. Download each current `image_url`.
2. Resize to card thumbnail dimensions.
3. Upload to R2 under a new prefix like `project-thumbnails/`.
4. Save the thumbnail URL in the database.

Use `sharp` for this in a script. Example target:

```TypeScript
sharp(input)
  .rotate()
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 65, effort: 5 })
```

If an image is animated, create a static thumbnail from the first frame.

### Priority 3: Generate thumbnail during upload/edit

The admin/edit flow should generate the thumbnail when a project image is uploaded. This prevents the same problem from coming back.

Relevant files to inspect when implementing:

* `components/edit-project-form.tsx`
* Admin project actions under `app/admin/projects`
* DB schema in `db/schema.ts`

### Priority 4: Reduce mobile paint cost

Change the fixed background on mobile:

```CSS
@media (max-width: 768px) {
  body {
    background-attachment: scroll;
  }

  .surface-glass {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background-color: rgba(255, 255, 255, 0.86);
  }
}
```

Also consider reducing card shadow strength on mobile.

### Priority 5: Reduce homepage image work

Options:

1. Show fewer cards on mobile, for example 4 per college instead of 10.
2. Add a "show more" link to `/projects`.
3. Render project sections with `content-visibility: auto`.
4. Keep horizontal carousels, but only render the first few cards initially.

Best fit: show fewer cards on the homepage and push full browsing to `/projects`. The homepage should be fast and preview-focused.

### Priority 6: Remove unnecessary `priority`

Keep `priority` only for the real LCP image.

Recommended:

* Keep priority on the main hero logo if it is the LCP.
* Remove priority from duplicate intro/hero decorative pattern images.
* Do not use priority for off-screen decorative images.

Relevant files:

* `components/page-intro.tsx`
* `components/hero.tsx`
* `components/bento-grid.tsx`

## Static Prerendering Strategy

The site already uses good static-friendly patterns:

* `cacheComponents: true` in `next.config.mjs`.
* `"use cache"`, `cacheLife("days")`, and `cacheTag("projects")`.
* `generateStaticParams()` on project detail pages.
* `Suspense` around `/projects` data.

Recommended strategy:

* Keep static prerendering for the homepage and project detail pages.
* Do not move homepage project cards fully client-side just to solve image loading. That would add hydration work and hurt performance.
* Use server-rendered cards, but render fewer cards and use real thumbnails.
* Keep `/projects` as the full browsing/search page. If the project count grows, reduce the client payload by passing card/search fields only, not full project details.
* Use `Suspense` for data sections, but it will not fix image decode pressure by itself.

## Implementation Order

1. Add `image_thumb_url` to the project model and database.
2. Create a thumbnail generation script for existing R2 images.
3. Update upload/edit flow to generate thumbnails.
4. Update `ProjectCard` to use thumbnail URLs.
5. Add mobile CSS overrides for `background-attachment` and blur.
6. Reduce homepage cards shown on mobile.
7. Remove duplicate/unneeded image `priority`.

## How To Verify

After implementing:

```Shell
pnpm format && pnpm lint && pnpm typecheck && pnpm build
```

Then test on phone or mobile emulation:

* Open `/`.
* Scroll through all project sections.
* Confirm no gray screen.
* Confirm image requests for card thumbnails are usually under `150 KB`.
* Confirm homepage still prerenders and does not rely on client-side loading for the main content.

