const express = require('express');
const router = express.Router();

//Routes go here

module.exports = router;


let coffeeRequesters = new Set();

router.get('/', (req, res) => {
    if (coffeeRequesters.size === 0) {
        res.send("Nobody wants coffee :(");
    } else {
        res.send(coffeeRequesters.size + " people want coffee");
    }
});

router.get('/coffee', (req, res) => {
    res.json({
        users: [...coffeeRequesters]
    });
});


router.post('/coffee', (req, res) => {
    console.log("%s requests coffee", req.body.name);
    coffeeRequesters.add(req.body.name);
    res.end();
});

// Empty current coffee requester list
router.delete('/coffee', (req, res) => {
    console.log("Clear coffee requests");
    coffeeRequesters.clear();
    res.end();
});