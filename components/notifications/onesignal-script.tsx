"use client"

import Script from "next/script"

const ONEIGNAL_APP_ID = "b811652a-61e7-4fc8-b989-ec55ceebf5fc"

export function OneSignalScript() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "${ONEIGNAL_APP_ID}",
              });
            });
          `,
        }}
      />
      <Script
        id="onesignal-sdk"
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
    </>
  )
}
