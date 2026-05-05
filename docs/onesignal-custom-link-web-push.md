# Custom-Styled OneSignal Web Push Notifications

A guide to replacing OneSignal's default prompted UI with your own subscribe/unsubscribe buttons while still using the OneSignal Web SDK v16 "Typical Site" integration under the hood.

## Overview

OneSignal offers two web push integration paths:

- **Custom Code** — You call `OneSignal.init()` yourself and control everything. Most flexible but requires handling service worker registration, permission prompts, and subscription state manually.
- **Typical Site** — You drop in a snippet and OneSignal manages the full lifecycle. It injects its own prompt UI (slidedown, bell, custom link).

The approach below uses **Typical Site** for the SDK and service worker management, but hides OneSignal's injected UI and replaces it with your own styled controls. This gives you the SDK's reliability for push subscription while keeping full control over appearance.

## Step 1 — Load the SDK with the deferred pattern

The `OneSignalDeferred` array must be populated **before** the SDK script loads. The SDK processes this array on load, so the init call must come first.

### Vanilla HTML

```html
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || []
  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: "YOUR_APP_ID",
    })
  })
</script>
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
```

### React / Next.js

Use an inline `<script>` for the deferred init (runs at hydrate time, before the SDK loads), then load the SDK asynchronously:

```tsx
<>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.init({ appId: "YOUR_APP_ID" });
        });
      `,
    }}
  />
  <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer />
</>
```

In Next.js, replace the second `<script>` with `<Script src="..." strategy="afterInteractive" />`.

### Vue / Nuxt

Use `useHead()` or place both scripts in `app.vue` / your layout head:

```js
useHead({
  script: [
    {
      innerHTML: `window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(async function(o){await o.init({appId:"YOUR_APP_ID"})});`,
    },
    { src: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js", defer: true },
  ],
})
```

**Key point:** never put `OneSignalDeferred.push(init)` inside an `onLoad` callback of the SDK script. By then the SDK has already consumed the deferred array and your init will be silently ignored.

## Step 2 — Place the hidden custom link container

OneSignal's "Typical Site" mode requires a `<div class="onesignal-customlink-container">` in the DOM. It injects its own subscribe/unsubscribe button inside this container. For our approach, you still include this container but hide it visually:

```html
<div
  class="onesignal-customlink-container"
  style="position:absolute;width:0;height:0;overflow:hidden;clip:rect(0,0,0,0)"
></div>
```

This satisfies the SDK's requirement while keeping its button invisible. You then render your own UI.

## Step 3 — Read subscription state

After the SDK initializes, check whether the user is already subscribed:

```js
OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.initialized

  // optedIn is a boolean property (not a function)
  var isSubscribed = OneSignal.User.PushSubscription.optedIn
  console.log("Subscribed:", isSubscribed)

  // Listen for future changes (user subscribes or unsubscribes)
  OneSignal.User.PushSubscription.addEventListener("change", function () {
    isSubscribed = OneSignal.User.PushSubscription.optedIn
    console.log("Subscription changed:", isSubscribed)
    // Update your UI here
  })
})
```

### Important v16 API notes

| What you might expect                      | What actually exists in v16                                    |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OneSignal.Notifications.isPushEnabled()`  | Does not exist. Use `OneSignal.User.PushSubscription.optedIn`  |
| `OneSignal.Notifications.optOut()`         | Does not exist. Use `OneSignal.User.PushSubscription.optOut()` |
| `OneSignal.User.PushSubscription.optedIn`  | Boolean property. `true` = subscribed and receiving push       |
| `OneSignal.User.PushSubscription.optOut()` | Async method. Unsubscribes the user                            |
| `OneSignal.Slidedown.promptPush()`         | Shows the browser permission prompt (if using slidedown)       |

## Step 4 — Subscribe action

There are two ways to trigger subscription from your custom button:

### Option A — Click the hidden SDK button

OneSignal's custom link container has a button or link inside it. You can programmatically click it:

```js
function handleSubscribe() {
  var link = document.querySelector(".onesignal-customlink-container a, .onesignal-customlink-container button")
  if (link) {
    link.click()
    return
  }
  // Fallback: use the API directly
  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.Slidedown.promptPush()
  })
}
```

This is the safest option because it goes through the same flow OneSignal expects.

### Option B — Call the API directly

```js
function handleSubscribe() {
  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.Slidedown.promptPush()
  })
}
```

This triggers the browser permission dialog directly without the slidedown animation.

## Step 5 — Unsubscribe action

```js
function handleUnsubscribe() {
  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.User.PushSubscription.optOut()
  })
}
```

After this call, `OneSignal.User.PushSubscription.optedIn` will become `false` and your change listener will fire.

## Step 6 — iOS Safari handling

Web push is not supported on iOS Safari unless the user has added the site to their home screen (standalone mode). Detect this:

```js
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}

var iOSButNotStandalone = isIOS() && !isStandalone()
```

When this is true, show a disabled button with a message like "Not available on Safari — add to home screen first" instead of the subscribe button.

## Step 7 — OneSignal dashboard configuration

In your OneSignal dashboard (**Settings > Web Push > Typical Site**):

1. Set **Site URL** to match your domain (e.g., `https://example.com`)
2. For local dev, add `http://localhost:3000` as an additional allowed origin
3. Under **Subscription Slidedown**, enable it and customize the prompt text if you want to customize what appears in the browser permission dialog
4. **Do not enable** the "Bell" or "Custom Link" prompt display — we handle those ourselves

## Full integration checklist

- [ ] SDK script loads with deferred init pattern (init before SDK script)
- [ ] Hidden `onesignal-customlink-container` present in DOM
- [ ] Custom subscribe button calls `link.click()` on the hidden container button, or `OneSignal.Slidedown.promptPush()`
- [ ] Custom unsubscribe button calls `OneSignal.User.PushSubscription.optOut()`
- [ ] Subscription state read via `OneSignal.User.PushSubscription.optedIn` (property, not function)
- [ ] Change listener on `OneSignal.User.PushSubscription` to keep UI in sync
- [ ] iOS Safari detection shows disabled state with instructions
- [ ] Dismiss/snooze with localStorage TTL
- [ ] OneSignal dashboard configured for Typical Site with correct Site URL

## Common pitfalls

1. **Init after SDK loads** — If you put `OneSignalDeferred.push(init)` in an `onLoad` callback of the SDK script, it will silently fail. The init must happen before the SDK processes the deferred array.

2. **Using `isPushEnabled()`** — This method does not exist in SDK v16. Use the `OneSignal.User.PushSubscription.optedIn` boolean property instead.

3. **Typo in container class** — The class must be exactly `onesignal-customlink-container` for the SDK to find it and wire up its internal logic.

4. **Service worker scope** — If using a service worker at a subdirectory (e.g., `/onesignal/OneSignalSDKWorker.js`), it must have the `Service-Worker-Allowed: /` response header to control the root scope. For Typical Site, the SDK handles this automatically — don't override `serviceWorkerPath` or `serviceWorkerParam`.

5. **Double init** — Guard against React Strict Mode or hot reload calling your init code twice by checking a ref or module-level flag.
