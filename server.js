const express = require('express');
const bodyParser = require('body-parser');


var firebase = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://coffee-light.firebaseio.com"
});


const routes = require('./app/routes');

const app = express();

// set our port
const port = process.env.PORT || 8080;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use((req, res, next) => {
    req.firebase = firebase;
    next();
});

// routes
app.use('/', routes);

app.use(express.static(__dirname + '/public'));


// start app at localhost:8080
app.listen(port);

console.log(`Listening on ${port}`);
module.exports = app;