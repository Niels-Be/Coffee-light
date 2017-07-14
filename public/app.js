// Initialize Firebase
var config = {
    apiKey: "AIzaSyD9lqJmbdm9l_QmhB4f1j_Kdu3fMYerGkA",
    authDomain: "coffee-light.firebaseapp.com",
    databaseURL: "https://coffee-light.firebaseio.com",
    projectId: "coffee-light",
    storageBucket: "coffee-light.appspot.com",
    messagingSenderId: "252605375808"
};
firebase.initializeApp(config);


const messaging = firebase.messaging();
const auth = firebase.auth();


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
    console.log("Message received. ", payload);

    if (payload.data.name !== coffeeLight.loadName()) {
        var notification = new Notification(payload.notification.title, payload.notification);
    }
});

function getToken() {
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    return messaging.getToken()
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
            console.log('Error retrieving Instance ID token. ', err);
        });
}


function loginOnServer(user) {
    return getToken().then((token) => {
		if(user.displayName == null) {
			return changeName("Coffee Lover");
		}
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

auth.onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;

        console.log("Signed in ", user);

        loginOnServer(user).catch((err) => {
            console.log("Unable to login on server", err);
        });
    } else {
        // User is signed out.

        console.log("Signed out");
    }
});



function changeName(name) {
    let authUpdate = auth.currentUser.updateProfile({
        displayName: name
    });

    let serverUpdate = fetch("./api/v1/register", {
        credentials: 'same-origin',
        method: 'POST',
        headers: new Headers({
            "content-type": "application/json",
            "cache-control": "no-cache"
        }),
        body: JSON.stringify({
            name: user.displayName
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
    return fetch(API_PREFIX + '/channels?search=' + searchString, {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}

var channelCache = [];

function getChannel(channelId, noCache) {
    let channel = noCache ? null : channelCache.find(c => c.id === channelId);
    if (channel)
        return Promise.resolve(channel);
    return fetch(API_PREFIX + '/channel?channelId=' + channelId, {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}

function createChannel(options) {
    return fetch(API_PREFIX + '/channel', {
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
    return fetch(API_PREFIX + '/channel', {
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
    return fetch(API_PREFIX + '/channel/subscription', {
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
    return fetch(API_PREFIX + '/channel/subscription', {
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
    return fetch(API_PREFIX + '/channel/notify', {
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

function getSubscriptions() {
    return fetch(API_PREFIX + '/subscriptions', {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
}