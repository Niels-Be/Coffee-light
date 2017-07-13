const firebase = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://coffee-light.firebaseio.com"
});

let messaging = firebase.messaging();



coffeLight.on("sendToUser", (user, payload, options) => {
    messaging.sendToDevice([...user.tokens], payload, options)
        .then((res) => {
            console.log("Firebase sendToDevice: ", res);
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
    messaging.subscribeToTopic([...user.tokens], "/topics/" + channel.id)
        .then((res) => {
            console.log("Firebase subscribe: ", res);
        })
        .catch((err) => {
            console.error(err);
        });
});

coffeLight.on("unsubscribeFromChannel", (user, channel) => {
    messaging.unsubscribeFromTopic([...user.tokens], "/topics/" + channel.id)
        .then((res) => {
            console.log("Firebase unsubscribe: ", res);
        })
        .catch((err) => {
            console.error(err);
        });
});