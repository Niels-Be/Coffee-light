const firebase = require("firebase-admin");


module.exports = function initFirebase(coffeLight, config) {

let adminApp = firebase.initializeApp({
    credential: firebase.credential.cert(config),
    databaseURL: "https://coffee-light.firebaseio.com"
});

let messaging = adminApp.messaging();



coffeLight.on("sendToUser", (user, payload, options) => {
    if (user.tokens.size === 0) {
        console.error("User has no vaild messaging token");
        return;
    }
    let tokens = [...user.tokens];
    messaging.sendToDevice(tokens, payload, options)
        .then((res) => {
            console.log("Firebase sendToDevice: ", res.successCount);
            if (res.failureCount > 0) {
                res.errors.forEach((err) => {
                    if (err.error.code === "messaging/registration-token-not-registered") {
                        console.log("Delete invalid token");
                        user.tokens.delete(tokens[err.index]);
                    } else {
                        console.error(err);
                    }
                });
            }
        })
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("sendToChannel", (channel, payload, options) => {
    messaging.sendToTopic("/topics/" + channel.id, payload, options)
        .then((res) => {
            console.log("Firebase sendToTopic: ", res);
        })
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("subscribeToChannel", (user, channel) => {
    if (user.tokens.size === 0) {
        console.error("User has no vaild messaging token");
        return;
    }
    let tokens = [...user.tokens];
    messaging.subscribeToTopic(tokens, "/topics/" + channel.id)
        .then((res) => {
            console.log("Firebase subscribe: ", res.successCount);
            if (res.failureCount > 0) {
                res.errors.forEach((err) => {
                    if (err.error.code === "messaging/registration-token-not-registered") {
                        console.log("Delete invalid token");
                        user.tokens.delete(tokens[err.index]);
                    } else {
                        console.error(err);
                    }
                });
            }
        })
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("unsubscribeFromChannel", (user, channel) => {
    if (user.tokens.size === 0) {
        console.error("User has no vaild messaging token");
        return;
    }
    let tokens = [...user.tokens];
    messaging.unsubscribeFromTopic(tokens, "/topics/" + channel.id)
        .then((res) => {
            console.log("Firebase unsubscribe: ", res.successCount);
            if (res.failureCount > 0) {
                res.errors.forEach((err) => {
                    if (err.error.code === "messaging/registration-token-not-registered") {
                        console.log("Delete invalid token");
                        user.tokens.delete(tokens[err.index]);
                    } else {
                        console.error(err);
                    }
                });
            }
        })
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("close", () => {
    adminApp.delete();
});

return adminApp;
};