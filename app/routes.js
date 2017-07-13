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



router.post('/register', authenticated((req, res) => {
    if (!req.user) {
        coffeLight.createUser(req.body).then((user) => {
            req.user = user;
            req.session.userId = user.id;
            res.end();
        });

    } else {
        if (req.body.name)
            req.user.name = req.body.name;
        if (req.body.token)
            req.user.addToken(req.body.token);
        res.end();
    }
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
    let channel = coffeLight.getChannel(req.query.channelId);
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

    let channel = null;
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
    req.user.subscribe(channel).then(() => {
        res.end();
    }).catch(next);
}));

router.delete('/channel/subscription', authenticated((req, res, next) => {
    let channel = coffeLight.getChannel(req.body.channelId);
    if (!channel) {
        return res.status(400).json({
            code: 404,
            error: "Channel not found"
        });
    }
    req.user.unsubscribe(channel).then(() => {
        if (channel.subscriptions <= 0) {
            //Delete channel if it is empty
            coffeLight.channels = coffeLight.channels.filter(c => c.id != channel.id);
        }
        res.end();
    }).catch(next);
}));


router.post('/channel/notify', authenticated((req, res, next) => {
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
    channel.notify(req.user).then(() => {
        req.end();
    }).catch(next);
}));

router.get('/subscription', authenticated((req, res, next) => {
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