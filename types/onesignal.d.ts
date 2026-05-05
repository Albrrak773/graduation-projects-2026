interface Window {
  OneSignalDeferred?: OneSignalDeferredCallback[]
}

type OneSignalDeferredCallback = (OneSignal: typeof import("onesignal-web-sdk")) => Promise<void>
