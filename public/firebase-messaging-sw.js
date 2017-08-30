importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js');
importScripts('./firebase.js');
importScripts('./localforage.min.js');

localforage.config()
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let notifications = {};
let userId = null;
let userName = null;
let lastUpdateCheck = 0;

localforage.getItem("userId").then((uid) => {
  userId = uid;
});

localforage.getItem("userName").then((name) => {
  userName = name;
});


self.addEventListener('message', function (msg) {
  if (msg.data.type === "notify") {
    handleIncommingNotification(msg.data.data);
  } else if (msg.data.type === "setUser") {
    console.log("Set user to " + msg.data.userName);
    userId = msg.data.userId;
    userName = msg.data.userName;
    localforage.setItem("userId", userId);
    localforage.setItem("userName", userName);
  }
});

function handleIncommingNotification(data) {
  data.ts = parseInt(data.ts) || 0;
  data.notification_ttl = parseInt(data.notification_ttl) || 60;
  if (data.type == "replay" || // always show replays
    !notifications[data.messageId] && // avoid duplicates
    data.user_id !== userId && // hide own messages
    data.name !== userName && // hide messages with same name
    data.ts > Date.now() - data.notification_ttl * 1000 // hide old messages
  ) {
    return makeNotification(data);
  } else {
    console.log("supress message\nDuplicate: %s\nUserId: %s\nUserName: %s\nTTL: %s\n", !notifications[data.messageId], data.user_id !== userId, data.name !== userName, data.ts > Date.now() - data.notification_ttl * 1000, data);
    return Promise.resolve();
  }
}

function makeNotification(data) {
  console.log('Received background message ', data);
  notifications[data.messageId] = true;

  if (lastUpdateCheck + 60 * 60 * 1000 < Date.now()) {
    lastUpdateCheck = Date.now();
    console.log("Check for updates");
    self.registration.update();
  }

  if (data.type === "replay") {
    if (data.action !== "accept") return;
    return self.registration.getNotifications({
      tag: data.messageId
    }).then((notifies) => {
      let notify = notifies.find((n) => n.data.messageId === data.messageId);
      if (!notify || notify.data.closed) return;
      notify.close();
      let data2 = notify.data;
      data2.acceptedUsers.push(data.name);
      return showNotification(data2, true);
    });
  } else {
    data.acceptedUsers = [];
    return showNotification(data);
  }
}

function showNotification(data, silent) {
  return self.registration.showNotification(data.notification_title, {
    body: data.notification_body + (data.acceptedUsers.length > 0 ? "\nAccepted: " + data.acceptedUsers.join(", ") : ""),
    icon: data.notification_icon,
    tag: data.messageId,
    data: data,
    //vibrate: !silent,
    silent: !!silent,
    actions: data.notification_enable_replay === "true" ? [{
        action: 'accept',
        title: '👍 me too'
      },
      {
        action: 'decline',
        title: '⤻ nope'
      }
    ] : undefined
  });
}

self.addEventListener('install', function () {
  console.log("Worker installed");
  self.skipWaiting();
  lastUpdateCheck = Date.now();
});
self.addEventListener('activate', event => {
  console.log("Worker actived");
  event.waitUntil(self.clients.claim());
});

messaging.setBackgroundMessageHandler((payload) => handleIncommingNotification(payload.data));

self.addEventListener("notificationclick", function (event) {
  console.log("notfification clicked", event);

  event.notification.close();
  event.notification.data.closed = true;
  delete notifications[event.notification.data.messageId];

  switch (event.action) {
    case "accept":
    case "decline":
      event.waitUntil(
        fetch('./api/v1/channel/replay', {
          "credentials": 'same-origin',
          "method": "POST",
          "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
          },
          "body": JSON.stringify({
            "channelId": event.notification.data.channel,
            "messageId": event.notification.data.messageId,
            "action": event.action,
          })
        }).then((res) => {
          if (res && res.status != 200) console.log(res.json());
        }).catch(console.error)
      );
      break;
    default:
      event.waitUntil(
        self.clients.claim().then(() => {
          return self.clients.matchAll({
            type: "window"
          })
        })
        .then(function (clientList) {
          console.log(clientList);
          if (clientList.length > 0) {
            return clientList[0].focus()
              .then(() => clientList[0].navigate("./#" + event.notification.data.channel_name))
          }
          if (self.clients.openWindow)
            return self.clients.openWindow("./#" + event.notification.data.channel_name);
        }).catch(console.error)
      );

  }

});