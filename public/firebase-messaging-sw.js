(function bootstrapFirebaseMessagingServiceWorker() {
  const params = new URL(self.location.href).searchParams;
  const config = {
    apiKey: params.get("apiKey") || "",
    authDomain: params.get("authDomain") || "",
    projectId: params.get("projectId") || "",
    storageBucket: params.get("storageBucket") || "",
    messagingSenderId: params.get("messagingSenderId") || "",
    appId: params.get("appId") || "",
    databaseURL: params.get("databaseURL") || "",
  };

  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
    return;
  }

  importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

  if (!self.firebase.apps.length) {
    self.firebase.initializeApp(config);
  }

  self.firebase.messaging();
})();

self.addEventListener("notificationclick", (event) => {
  const href = event.notification?.data?.href;
  event.notification?.close();

  if (!href) {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url === href) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(href);
      }

      return undefined;
    }),
  );
});
