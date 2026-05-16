# Frontend Design Guide

This guide documents the reusable frontend design direction from this project. It is brand-neutral: use your own brand colors, logo, typography, and content, but keep the same layout, spacing, component behavior, and animation system.

## Libraries Used

* React 18 with TypeScript.
* Vite for development and build.
* Tailwind CSS for styling.
* CSS variables for theme tokens.
* shadcn-style UI components built on Radix UI.
* `lucide-react` for icons.
* `framer-motion` for page, section, button, and card animation.
* `lenis` for smooth scrolling.
* `tailwindcss-animate` for utility animations.
* `react-router-dom` for page routing.
* `@tanstack/react-query` for server state.
* `sonner` and Radix Toast for notifications.

## Theme System

Use semantic tokens instead of fixed colors. The design should work with any brand by changing variables only.

Core tokens:

* `background`
* `foreground`
* `card`
* `card-foreground`
* `primary`
* `primary-foreground`
* `secondary`
* `secondary-foreground`
* `accent`
* `accent-foreground`
* `muted`
* `muted-foreground`
* `border`
* `input`
* `ring`
* `container`

Design rule:

* Global brand colors belong in CSS variables.
* Special campaign or ad sections can use scoped variables.
* Avoid hardcoded colors inside reusable components.
* Do not mention exact brand colors in new project documentation unless the target brand requires them.

## Typography

The design uses a modern sans-serif hierarchy:

* Large bold hero headings.
* Strong section headings.
* Compact card headings.
* Relaxed body copy.
* Small uppercase or semi-bold labels.
* `tabular-nums` for numbers, prices, and stats.

For another brand, replace the font family but keep the same hierarchy and spacing.

## Layout Rules

* Use full-width page sections.
* Use centered inner containers, normally `max-w-7xl mx-auto`.
* Use narrower containers for hero or CTA text, normally `max-w-3xl` or `max-w-4xl`.
* Use `px-6 md:px-12` for section side padding.
* Use large vertical spacing: `py-20`, `py-28`, or larger for major sections.
* Use `pt-28` or more below the floating header.
* Use responsive grids for cards.
* Keep mobile layouts stacked and simple.

## Main Design Components

### Floating Header

The header is a fixed glass-style navigation bar.

Key design:

* Fixed at the top with `top-4`.
* Centered with horizontal page padding.
* Rounded large radius.
* Semi-transparent background with backdrop blur.
* Border with low opacity.
* Expands when page is at top.
* Collapses after scrolling.
* Expands again on hover.
* Includes logo, navigation links, CTA button, language switch, and mobile menu.

Important behavior:

* Tracks active sections using `data-nav-section`.
* Uses Framer Motion layout animation.
* Uses animated mobile menu panel.
* Changes visual tint when entering a special themed section.

### Hero Section

The hero is centered and minimal, with motion and decorative floating icons.

Key design:

* Full viewport height or near full viewport height.
* Centered content.
* Large heading split into multiple animated lines.
* Short supporting paragraph.
* Two CTA buttons.
* Decorative floating icons/logos around the content.
* Optional gradient text for the emphasized line.
* Optional ring/ripple decorative background.

Motion:

* Use `HeroFade` for immediate fade-up entrance.
* Use small delay between heading lines and buttons.
* Floating icons use slow CSS animation.
* Decorative icons are `pointer-events-none`.

### Project Showcase

The works/projects section is one of the main visual patterns.

Key design:

* Intro heading before the showcase.
* Desktop sticky scroll experience.
* One project panel visible at a time.
* Image on one side and text on the other.
* Alternating layout direction between projects.
* Soft glow behind the project image.
* Image hover zoom.
* Vertical dot navigation on desktop.
* Mobile falls back to normal stacked panels.

Sizing:

* Desktop showcase wrapper can use a tall scroll area such as `md:h-[300dvh]` for three projects.
* Sticky viewport uses `md:sticky md:top-0 md:h-dvh`.
* Image cards use rounded corners, border, shadow, and overflow hidden.

### Stats Cards

Stats are shown as compact cards with icon, animated number, and label.

Key design:

* Two-column grid on mobile.
* More spacious grid on desktop.
* Rounded cards.
* Border and soft shadow.
* Icon in a small rounded square.
* Large bold number.
* Short label text.
* Hover lift on desktop.

Motion:

* Count up once when card enters view.
* Use `framer-motion` `animate`.
* Respect reduced motion.

## Important Ad Card: “Need A Tech Partner?”

This is the key advertising card style from the home page CTA banner. Use this pattern for website ads, campaign sections, landing-page conversion blocks, or mid-page lead generation.

Current text example:

```text
Need a partner for your tech transformation?
```

Purpose:

* Create a strong conversion moment between content sections.
* Work as a reusable ad card.
* Push the user toward booking/contact/consultation.
* Feel premium without depending on a specific brand palette.

### Card Placement

Use it as a full-width section with page padding:

```TSX
<section className="w-full px-6 md:px-12 py-20 md:py-28">
  <div className="max-w-7xl mx-auto w-full">
    {/* ad card */}
  </div>
</section>
```

### Card Container

Recommended structure:

```TSX
<div className="relative overflow-hidden rounded-3xl px-8 md:px-16 py-16 md:py-20 shadow-xl bg-primary">
  {/* decorative overlays */}
  <div className="relative z-10 flex flex-col items-center text-center gap-8">
    <h2 className="text-primary-foreground font-bold text-2xl md:text-4xl lg:text-5xl leading-tight">
      Need a partner for your tech transformation?
    </h2>
    <button className="bg-background text-primary rounded-xl px-8 py-3 text-sm font-bold hover:opacity-90 transition shadow-lg">
      Book a consultation
    </button>
  </div>
</div>
```

### Size

Use these dimensions as the default:

* Outer section padding: `py-20 md:py-28`.
* Container width: `max-w-7xl`.
* Card padding: `px-8 md:px-16 py-16 md:py-20`.
* Border radius: `rounded-3xl`.
* Heading: `text-2xl md:text-4xl lg:text-5xl`.
* Button: `px-8 py-3`, `rounded-xl`.
* Internal gap: `gap-8`.

The card should feel large enough for ads, but not like a full hero. It should sit between sections and create a clear pause.

### Theme

The card theme should be token-based:

* Card background: `bg-primary`, `bg-container`, or a campaign-specific token.
* Heading: high contrast foreground token.
* Button: inverse surface, normally `bg-background text-primary`.
* Decorative overlays: use brand image texture, soft gradient, or tokenized accent gradients.

Do not hardcode a specific color. For another brand, replace the token values only.

### Decorative Overlays

The current card uses repeated cloudy gradient images as subtle overlays.

Reusable overlay rules:

* Place overlays as absolute images or gradient layers.
* Use low opacity.
* Use `mix-blend-screen` only on dark backgrounds.
* Keep overlays behind text with `relative z-10` on content.
* Use `pointer-events-none`.
* Use large oversized image layers, for example `w-[120%] h-[150%]`.
* Rotate or mirror duplicate layers for depth.

Example overlay pattern:

```TSX
<img
  src={texture}
  alt=""
  aria-hidden
  className="pointer-events-none absolute -top-1/4 -left-1/4 w-[120%] h-[150%] object-cover opacity-25 mix-blend-screen"
/>
<img
  src={texture}
  alt=""
  aria-hidden
  className="pointer-events-none absolute -bottom-1/3 -right-1/4 w-[110%] h-[140%] object-cover opacity-20 mix-blend-screen rotate-180"
/>
```

If no image texture exists, use a tokenized radial gradient instead.

### Content Style

Keep the ad card focused:

* One strong headline.
* One CTA button.
* Optional short line of supporting text only if needed.
* No long feature list.
* No pricing table.
* No service grid.

Good headline patterns:

* “Need a tech partner?”
* “Ready to launch your next digital product?”
* “Looking for a team to build it with you?”
* “Let’s turn your idea into a working product.”

CTA patterns:

* “Book a consultation”
* “Start your project”
* “Talk to us”
* “Get a proposal”

### Animation

Use simple animation only:

* Fade the whole card up when it enters view.
* Slight button hover/tap animation.
* Optional very slow background texture movement.

Avoid complex quiz-style or multi-step interactions inside this ad card. The card should be direct and conversion-focused.

## Motion System

Use Framer Motion with a consistent easing curve:

```TypeScript
[0.22, 1, 0.36, 1]
```

Shared motion patterns:

* Page fade: short opacity transition.
* Hero fade: opacity plus slight upward movement.
* Section reveal: opacity plus `y: 22-32`.
* Staggered grid reveal: parent controls child delay.
* Button hover: slight scale up.
* Button tap: slight scale down.
* Card hover: slight upward lift.

Recommended durations:

* Button feedback: `0.16s` to `0.25s`.
* Section reveal: `0.45s` to `0.65s`.
* Larger visual transition: `0.8s` to `1.2s`.

Always support reduced motion:

* Use `useReducedMotion()`.
* Disable decorative infinite motion when reduced motion is enabled.
* Add a global `prefers-reduced-motion` CSS rule.

## CSS Animation Utilities

Reusable classes from the project:

* `float-a`, `float-b`, `float-c`, `float-d`: slow floating decorative elements.
* `bounce-slow`: scroll cue movement.
* `text-gradient-brand`: animated gradient text.
* `ripple-bg`: concentric ring hero background.
* `nav-traveling-border`: animated header border flash.
* `shadow-card`, `shadow-elevated`, `shadow-contact`: reusable shadows.

When moving to another brand, keep the animation names and replace the color tokens.

## UI Primitives

The project includes shadcn/Radix primitives for accessible UI:

* Button
* Card
* Dialog
* Sheet
* Dropdown menu
* Navigation menu
* Tooltip
* Toast
* Tabs
* Accordion
* Form
* Input
* Textarea
* Select
* Checkbox
* Switch
* Slider
* Popover
* Hover card
* Calendar
* Carousel
* Table
* Skeleton

Use these primitives instead of rebuilding menus, dialogs, popovers, tabs, and form controls from scratch.

## Accessibility

* Use real buttons for actions.
* Use links for navigation.
* Add `aria-label` to icon-only controls.
* Keep decorative images empty with `alt=""`.
* Mark decorative layers with `aria-hidden`.
* Use Radix components for accessible dialogs and menus.
* Keep focus states visible through the `ring` token.
* Maintain strong text contrast after brand colors change.
* Support RTL by passing `dir` to sections and flipping directional icons.
* Respect reduced motion.

## Brand Reuse Checklist

1. Replace logo and image assets.
2. Replace CSS variable values with the new brand theme.
3. Replace typography in Tailwind config.
4. Keep semantic class names such as `bg-primary`, `text-foreground`, and `border-border`.
5. Reuse the floating header, hero, project showcase, stats cards, footer, and ad card pattern.
6. Keep the “Need a tech partner?” ad card as a standalone conversion block.
7. Remove service-specific, pricing-specific, or quiz-specific content if the new project does not need it.
8. Audit hardcoded colors and move them into global or scoped variables.
9. Test mobile, tablet, desktop, RTL if needed, and reduced motion.

## What To Exclude In Reuse

Do not carry over content-specific business logic unless the new project needs it:

* Quiz flow.
* Service recommendation logic.
* Pricing/package plan details.
* Product-specific Odoo theme.
* Old placeholder text.
* Fixed booking URLs.
* Specific service categories.

Keep only the design system, layout patterns, motion behavior, reusable UI primitives, and the ad-card style.
