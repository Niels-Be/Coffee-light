// Initialize Firebase
firebase.initializeApp(firebaseConfig);


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
signIn.promise = new Promise(function(resolve, reject){
	signIn.resolve = resolve;
	signIn.reject = reject;
});

function signedInFetch() {
	const args = arguments;
	return signIn.promise.then(() => {
		return fetch.apply(undefined, args);
	}).then((res)=>{
        if(res.status == 401) {
            console.log("Session expired");
            
            signIn.promise = new Promise(function(resolve, reject){
                signIn.resolve = resolve;
                signIn.reject = reject;
            });
            return loginOnServer(auth.currentUser).then(()=>{
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

        loginOnServer(user).catch((err) => {
            console.log("Unable to login on server", err);
        }).then(signIn.resolve);
    } else {
        // User is signed out.

        console.log("Signed out");
    }
});


function changeName(name) {
    let authUpdate = auth.currentUser.updateProfile({
        displayName: name
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

function getChannel(channelId, noCache) {
    let channel = noCache ? null : channelCache.find(c => c.id === channelId);
    if (channel)
        return Promise.resolve(channel);
    return signedInFetch(API_PREFIX + '/channel?channelId=' + channelId, {
            "credentials": 'same-origin'
        })
        .then((res) => {
            if (res.status != 200)
                return Promise.reject(res);
            return res.json();
        });
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