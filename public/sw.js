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
        url: data.url || "https://graduation.gdg-q.com",
        notificationId: data.notificationId || null,
      },
    }
    event.waitUntil(self.registration.showNotification(data.title || "مشاريع التخرج", options))
  }
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || "https://graduation.gdg-q.com"

  if (data.notificationId) {
    event.waitUntil(
      self.registration.pushManager.getSubscription().then(function (subscription) {
        var clickPayload = {
          notificationId: data.notificationId,
          endpoint: subscription ? subscription.endpoint : "",
        }
        fetch("/api/notification-clicked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clickPayload),
        }).catch(function () {})
        return clients.openWindow(url)
      })
    )
  } else {
    event.waitUntil(clients.openWindow(url))
  }
})
