self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || "",
      icon: data.icon || "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || "/",
      },
    }
    event.waitUntil(self.registration.showNotification(data.title || "مشاريع التخرج", options))
  }
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(clients.openWindow(url))
})

self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey })
      .then(function (subscription) {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      })
  )
})
