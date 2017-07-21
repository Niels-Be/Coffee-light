const express = require('express');

const router = express.Router();


function authenticated(cb, noHandleError) {
    return (req, res, next) => {
        let type, token;
        if (req.session.userId) {
            req.user = coffeLight.getUser(req.session.userId);
            if (!req.user) {
                //e.g. load from db or should not hcoffeLighten
                console.log("User %d not found", req.session.userId);
            }
            req.session.touch();
        }
        if (!req.user && !noHandleError)
            return res.sendStatus(401);
        cb(req, res, next);
    };
}



router.post('/register', authenticated((req, res, next) => {
    function ensureUser() {
        if (req.user) return Promise.resolve();
        return (req.body.id ? coffeLight.getOrCreateUser(req.body.id, req.body) : coffeLight.createUser(req.body))
            .then((user) => {
                req.user = user;
                req.session.userId = user.id;
            });
    }
    ensureUser().then(() => {
        if (req.body.name)
            req.user.name = req.body.name;
        if (req.body.token)
            req.user.addToken(req.body.token);
        res.end();
    }).catch(next);
}, true));



router.get('/channels', (req, res) => {
    let q = req.query.search || "";
    let cs = coffeLight.channels
        .filter(c => c.name.startsWith(q))
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                hasPassword: !!c.password,
                subscriptions: c.subscriptions
            };
        });

    res.json({
        channels: cs
    });
});

router.get('/channel', (req, res) => {
    let channel = null;
    if(req.query.channelId) {
        channel = coffeLight.getChannel(req.query.channelId);
    }
    else if(req.query.channelName) {
        channel = coffeLight.channels.find(c=>c.name === req.query.channelName);
    }
    else {
        return res.status(400).json({
            code: 400,
            error: "`channelId` or `channelName` is required"
        });
    }

    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }

    // Remove password before sending
    channel = Object.assign({}, channel);
    channel.hasPassword = !!channel.password;
    delete channel.password;
    res.json({
        channel: channel
    });
});

router.put('/channel', authenticated((req, res, next) => {
    if (!req.body.name) {
        return res.status(400).json({
            code: 400,
            error: "Channel name is required"
        });
    }
    
    let channel = coffeLight.channels.find(c=>c.name === req.body.name);
    if (channel) {
        return res.status(400).json({
            code: 409,
            error: "Name already taken"
        });
    }

    coffeLight.createChannel(req.body)
        .then((c) => {
            channel = c;
            return req.user.subscribe(channel);
        })
        .then(() => {
            res.json({
                channel: channel
            });
        }).catch(next);

}));

router.post('/channel', authenticated((req, res, next) => {
    let channel = coffeLight.getChannel(req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    if (!req.user.subscriptions.has(channel.id)) {
        return res.status(400).json({
            code: 403,
            error: "Not member of that channel"
        });
    }

    //Overwrite only existing properties
    Object.keys(req.body).forEach((key) => {
        if (key !== "id" && channel.hasOwnProperty(key)) {
            channel[key] = req.body[key];
        }
    });

    res.json({
        channel: channel
    });
}));

router.post('/channel/subscription', authenticated((req, res, next) => {
    let channel = coffeLight.getChannel(req.body.channelId);
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
    req.user.subscribe(channel);
    res.end();
}));

router.delete('/channel/subscription', authenticated((req, res, next) => {
    let channel = coffeLight.getChannel(req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    req.user.unsubscribe(channel);
    //Delete channel if it is empty
    if (channel.subscriptions <= 0) {
        console.log("Delete empty channel[%s] %s", channel.id, channel.name);
        coffeLight.channels = coffeLight.channels.filter(c => c.id != channel.id);
    }
    res.end();
}));


router.post('/channel/notify', authenticated((req, res, next) => {
    if(Date.now() - req.user.lastNotify < coffeLight.config.notifyTimeout) {
        return res.status(400).json({
            code: 429,
            error: "To many notify requests"
        });
    }
    req.user.lastNotify = Date.now();

    let channel = coffeLight.getChannel(req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    if (!req.user.subscriptions.has(channel.id)) {
        return res.status(400).json({
            code: 403,
            error: "Not member of that channel"
        });
    }
    channel.notify(req.user);
    res.end();
}));

router.get('/subscriptions', authenticated((req, res, next) => {
    res.json({
        subscriptions: [...req.user.subscriptions]
    });
}));


router.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(err.code || 500).json({
        code: err.code,
        error: err.message
    });
});


module.exports = router;