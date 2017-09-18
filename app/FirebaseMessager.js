const firebase = require("firebase-admin");


module.exports = function initFirebase(coffeLight, config) {

let adminApp = firebase.initializeApp({
    credential: firebase.credential.cert(config),
    databaseURL: "https://coffee-light.firebaseio.com"
});

let messaging = adminApp.messaging();



coffeLight.on("sendToUser", (user, payload, options) => {
    if (user.tokens.size === 0) {
        return cleanupUser(user);
    }
    let tokens = [...user.tokens];
    messaging.sendToDevice(tokens, payload, options)
        .then((res) => {
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
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("subscribeToChannel", (user, channel) => {
    if (user.tokens.size === 0) {
        return cleanupUser(user);
    }
    let tokens = [...user.tokens];
    messaging.subscribeToTopic(tokens, "/topics/" + channel.id)
        .then((res) => {
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
        return cleanupUser(user);
    }
    let tokens = [...user.tokens];
    messaging.unsubscribeFromTopic(tokens, "/topics/" + channel.id)
        .then((res) => {
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

function cleanupUser(user) {
    console.error("User(%s) %s has no vaild messaging token", user.id, user.name);
    //TODO maybe delete user
}

return adminApp;
};