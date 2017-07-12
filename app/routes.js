const express = require('express');
const router = express.Router();

//Routes go here

module.exports = router;


let coffeeRequesters = new Set();

let devices = new Set();

/*router.get('/', (req, res) => {
    if (coffeeRequesters.size === 0) {
        res.send("Nobody wants coffee :(");
    } else {
        res.send(coffeeRequesters.size + " people want coffee");
    }
}); */

router.post('/register', (req, res) => {
    console.log("Added device token ", req.body);
    devices.add(req.body.token);
    res.end();
});

router.get('/coffee', (req, res) => {
    res.json({
        reqeusts: [...coffeeRequesters]
    });
});


router.post('/coffee', (req, res) => {
    console.log("%s requests coffee", req.body.name);
    coffeeRequesters.add(req.body.name);

    if (devices.size > 0) {
        req.firebase.messaging().sendToDevice([...devices], {
            notification: {
                "title": "Coffee!!!!",
                "body": req.body.name + " wants coffee",
                "icon": "coffee.png",
                "click_action": "http://localhost:" + req.app.locals.port
            },
        }).then((msgRes) => {
            console.log("Send message suc");
        }).catch((err) => {
            console.log("Send message error", err);
        });
    }

    res.end();
});

// Empty current coffee requester list
router.delete('/coffee', (req, res) => {
    console.log("Clear coffee requests");
    coffeeRequesters.clear();
    res.end();
});