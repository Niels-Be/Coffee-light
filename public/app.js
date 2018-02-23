// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();
const auth = firebase.auth();

const workerPromise = navigator.serviceWorker.register("firebase-messaging-sw.js")
    .then((reg) => {
        messaging.useServiceWorker(reg);
        return reg;
    })
    .catch(console.error);

//Delete old service worker
navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
        registrations.forEach((reg) => {
            if (reg.scope.endsWith("/firebase-cloud-messaging-push-scope")) {
                console.log("unregister old service worker");
                reg.unregister();
            }
        });
    });

function sendToWorker(data) {
    return workerPromise.then((reg) => {
        if (reg.active == null) {
            console.log("Worker not jet active");
            return new Promise((resolve, reject) => {
                setTimeout(resolve, 500);
            }).then(() => sendToWorker(data));
        } else {
            reg.active.postMessage(data);
        }
    });
}


messaging.onTokenRefresh(function () {
    messaging.getToken()
        .then(function (refreshedToken) {
            console.log('Token refreshed.');
            // Send Instance ID token to app server.
            return fetch("./api/v1/register", {
                credentials: 'same-origin',
                method: 'POST',
                headers: new Headers({
                    "content-type": "application/json"
                }),
                body: JSON.stringify({
                    token: currentToken
                })
            });
        })
        .catch(function (err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
});

// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a sevice worker
//   `messaging.setBackgroundMessageHandler` handler.
messaging.onMessage(function (payload) {
    console.log("Frontend message received.");
    sendToWorker({
        type: "notify",
        data: payload.data
    });
});

function getToken() {
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    return workerPromise.then(() => {
            return messaging.getToken()
        })
        .then(function (currentToken) {
            if (currentToken) {
                console.log("Got Messaging token");
                return currentToken;
            } else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
                // Show permission UI.
                return requestPermission().then(getToken);
            }
        })
        .catch(function (err) {
            console.log('An error occurred while retrieving token. ', err);
        });
}

function requestPermission() {
    console.log('Requesting permission...');
    return messaging.requestPermission()
        .then(function () {
            console.log('Notification permission granted.');
        })
        .catch(function (err) {
            console.log('Unable to get permission to notify.', err);
        });
}

function deleteToken() {
    // Delete Instance ID token.
    messaging.getToken()
        .then(function (currentToken) {
            messaging.deleteToken(currentToken)
                .then(function () {
                    console.log('Token deleted.');
                    //TODO update server
                })
                .catch(function (err) {
                    console.log('Unable to delete token. ', err);
                });
        })
        .catch(function (err) {
            console.log('Error retrieving Instance IDsetUser token. ', err);
        });
}


function loginOnServer(user) {
    return getToken().then((token) => {
        return fetch("./api/v1/register", {
            credentials: 'same-origin',
            method: 'POST',
            headers: new Headers({
                "content-type": "application/json"
            }),
            body: JSON.stringify({
                token: token,
                name: user.displayName,
                id: user.uid
            })
        });
    });
}


auth.signInAnonymously().catch(console.error);
const signIn = {};
signIn.promise = new Promise(function (resolve, reject) {
    signIn.resolve = resolve;
    signIn.reject = reject;
});

function signedInFetch() {
    const args = arguments;
    return signIn.promise.then(() => {
        return fetch.apply(undefined, args);
    }).then((res) => {
        if (res.status == 401) {
            console.log("Session expired");

            signIn.promise = new Promise(function (resolve, reject) {
                signIn.resolve = resolve;
                signIn.reject = reject;
            });
            return loginOnServer(auth.currentUser).then(() => {
                signIn.resolve();
                return signedInFetch.apply(this, arguments);
            });
        }
        return res;
    });
}

auth.onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        if (user.displayName === null) {
            user.displayName = "Coffee Lover";
            auth.currentUser.updateProfile({
                displayName: "Coffee Lover"
            });
        }

        console.log("Signed in ", user);
        sendToWorker({
            type: "setUser",
            userId: user.uid,
            userName: user.displayName
        });

        loginOnServer(user).catch((err) => {
            console.log("Unable to login on server", err);
        }).then(signIn.resolve);
    } else {
        // User is signed out.

        console.log("Signed out");
    }
});


function changeName(name) {
  let authUpdate = signIn.promise.then(() => {
    auth.currentUser.updateProfile({
      displayName: name
    });
    
    sendToWorker({
        type: "setUser",
        userId: auth.currentUser.uid,
        userName: name
    });
  });

  let serverUpdate = signedInFetch("./api/v1/register", {
      credentials: 'same-origin',
      method: 'POST',
      headers: new Headers({
          "content-type": "application/json",
          "cache-control": "no-cache"
      }),
      body: JSON.stringify({
          name: name
      })
  });

  return Promise.all([authUpdate, serverUpdate]);
}



////// API //////
var API_PREFIX = './api/v1';

function getChannels() {
    return searchChannels("");
}

function searchChannels(searchString) {
    return signedInFetch(API_PREFIX + '/channels?search=' + searchString, {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}

var channelCache = [];

function _getChannel(by, value) {
    return signedInFetch(API_PREFIX + '/channel?channel' + by + '=' + value, {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}

function getChannel(channelId, noCache) {
    // FIXME: channel cache is never written
    let channel = noCache ? null : channelCache.find(c => c.id === channelId);
    if (channel)
        return Promise.resolve(channel);
    return _getChannel('Id', channelId);
}

function getChannelByName(channelName, noCache) {
    let channel = noCache ? null : channelCache.find(c => c.name === channelName);
    if (channel)
        return Promise.resolve(channel);
    return _getChannel('Name', channelName);
}

function createChannel(options) {
    return signedInFetch(API_PREFIX + '/channel', {
        "credentials": 'same-origin',
        "method": "PUT",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "body": JSON.stringify(options)
    }).then((res) => {
        if (res.status != 200)
            return Promise.reject(res);
        return res.json();
    });
}

function updateChannel(channelId, options) {
    let body = Object.assign({
        channelId
    }, options);
    return signedInFetch(API_PREFIX + '/channel', {
        "credentials": 'same-origin',
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "body": JSON.stringify(body)
    }).then((res) => {
        if (res.status != 200)
            return Promise.reject(res);
        return res.json();
    });
}

function subscribeToChannel(channelId, password) {
    return signedInFetch(API_PREFIX + '/channel/subscription', {
        "credentials": 'same-origin',
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "body": JSON.stringify({
            "channelId": channelId,
            "password": password
        })
    }).then((res) => {
        if (res.status != 200)
            return Promise.reject(res);
    });
}

function unsubscribeFromChannel(channelId) {
    return signedInFetch(API_PREFIX + '/channel/subscription', {
        "credentials": 'same-origin',
        "method": "DELETE",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "body": JSON.stringify({
            "channelId": channelId
        })
    }).then((res) => {
        if (res.status != 200)
            return Promise.reject(res);
    });
}

function sendNotification(channelId) {
    return signedInFetch(API_PREFIX + '/channel/notify', {
        "credentials": 'same-origin',
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "body": JSON.stringify({
            "channelId": channelId
        })
    }).then((res) => {
        if (res.status != 200)
            return Promise.reject(res);
    });
}

function getSubscriptions() {
    return signedInFetch(API_PREFIX + '/subscriptions', {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}

function getSubscripedChannels() {
    return Promise.all([getSubscriptions(), getChannels()])
        .then((res) => {
            const channels = res[1].channels;
            const subscriptions = res[0].subscriptions;
            return channels.filter((c) => subscriptions.indexOf(c.id) >= 0);
        });
}