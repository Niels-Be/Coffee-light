const express = require('express');
const firebase = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://coffee-light.firebaseio.com"
});
let messaging = firebase.messaging();

let config = {
    externalUrl: "http://localhost:8080"
};

const router = express.Router();


class Channel {

    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.password = options.password || "";
        this.ttl = options.ttl || 60;
        this.requestText = options.requestText || "I want coffee!";
        this.message = options.message || "%n wants coffee";
        this.title = options.title || "Coffee!!!";
        this.icon = options.icon || "coffee.png";

        this.subscribtions = 0;
    }

    send(payload, options) {
        return messaging.sendToTopic(this.id, payload, options)
            .then((res) => {
                console.log("Send suc:", res);
            });
    }

    notify(user) {
        return this.send({
            notification: {
                "title": this.title,
                "body": formatMessage(this.message, this, user),
                "icon": this.icon,
                "click_action": config.externalUrl + "#" + this.name
            },
            data: {
                "name": user.name,
                "channel": this.id,
                "ts": Date.now()
            }
        }, {
            timeToLive: this.ttl
        });
    }

}

function formatMessage(msg, channel, user) {
    return msg
        .replace("%u", user.name)
        .replace("%c", channel.name)
        .replace("%d", new Date().toString());
}

class User {
    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.tokens = new Set(options.tokens || []);
        this.subscribtions = new Set(options.subscribtions || []);
    }

    addToken(token) {
        this.tokens.add(token);
    }

    revokeToken(token) {
        this.tokens.delete(token);
    }

    subscribe(channel) {
        if (this.tokens.length === 0) return Promise.reject("NO_TOKENS");
        return messaging.subscribeToTopic([...this.tokens], "/topics/" + channel.id)
            .then((res) => {
                console.log("Subscribe suc: ", res);
                channel.subscribtions++;
                this.subscribtions.add(channel.id);
            });
    }

    unsubscribe(channel) {
        return messaging.unsubscribeFromTopic([...this.tokens], "/topics/" + channel.id)
            .then((res) => {
                console.log("Unsubscribe suc: ", res);
                channel.subscribtions--;
                this.subscribtions.delete(channel.id);
            });
    }

    send(payload, options) {
        return messaging.sendToDevice([...this.tokens], payload, options)
            .then((res) => {
                console.log("Send suc:", res);
            });
    }
}



let channels = [];
let channelIdCounter = 1;
let users = [];
let userIdCounter = 1;

router.use((req, res, next) => {
    if (req.session.userId) {
        req.user = users.find(u => u.id == req.session.userId);
        if (!req.user) {
            //e.g. load from db or should not happen
            console.log("User %d not found", req.session.userId);
        }
        req.session.touch();
    }
    next();
});



router.post('/register', (req, res) => {
    if (!req.user) {
        let id = userIdCounter++;
        req.user = new User(id, {});
        console.log("Created new User[%d] %s", id, req.body.name);
        users.push(req.user);
        req.session.userId = id;
    }
    if (req.body.name)
        req.user.name = req.body.name;
    if (req.body.token)
        req.user.addToken(req.body.token);
    res.end();
});



router.get('/channels', (req, res) => {
    let q = req.query.search || "";
    let cs = channels
        .filter(c => c.name.startsWith(q))
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                hasPassword: !!c.password
            };
        });

    res.json({
        channels: cs
    });
});

router.put('/channel', (req, res, next) => {
    if (!req.body.name) {
        return res.status(400).json({
            code: 400,
            error: "Channel name is required"
        });
    }
    let channel = new Channel(channelIdCounter++, req.body);
    console.log("Created new Channel[%d] %s", channel.id, req.body.name);
    channels.push(channel);

    req.user.subscribe(channel).then(() => {
        res.json({
            channel: channel
        });
    }).catch(next);

});

router.post('/channel/subscribtion', (req, res, next) => {
    let channel = channels.find(c => c.id == req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    if (channel.password && channel.password !== req.body.password) {
        return res.status(404).json({
            code: 407,
            error: "Invalid password"
        });
    }
    req.user.subscribe(channel).then(() => {
        res.end();
    }).catch(next);
});

router.delete('/channel/subscribtion', (req, res, next) => {
    let channel = channels.find(c => c.id == req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    req.user.unsubscribe(channel).then(() => {
        if (channel.subscribtions <= 0) {
            //Delete channel if it is empty
            channels = channels.filter(c => c.id != channel.id);
        }
        res.end();
    }).catch(next);
});


router.post('/channel/notify', (req, res, next) => {
    let channel = channels.find(c => c.id == req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    if (!req.user.subscribtions.has(channel.id)) {
        return res.status(400).json({
            code: 403,
            error: "Not member of that channel"
        });
    }
    channel.notify(req.user).then(() => {
        req.end();
    }).catch(next);
});

router.get('/subscribtions', (req, res, next) => {
    res.json({
        subscribtions: [...req.user.subscribtions]
    });
});


router.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({
        code: err.code,
        error: err
    });
});


module.exports = router;