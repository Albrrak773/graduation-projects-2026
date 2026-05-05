"use client"

import Script from "next/script"

const ONEIGNAL_APP_ID = "658a1ccd-e66c-4008-a6e6-285059302383"

export function OneSignalScript() {
  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.OneSignalDeferred = window.OneSignalDeferred || []
        window.OneSignalDeferred.push(async function (OneSignal) {
          await OneSignal.init({
            appId: ONEIGNAL_APP_ID,
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
          })
        })
      }}
    />
  )
}
