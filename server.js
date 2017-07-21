const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');


const CoffeLight = require('./app/app');



let config = {};
if (fs.existsSync(__dirname + "/config.json")) {
    config = require("./config.json");
} else {
    console.error("WARNING: Could not find config.json. Using default values");
}

global.coffeLight = new CoffeLight(config);


const routes = require('./app/routes');
const webSocketRoutes = require('./app/websocket');


require('./app/FirebaseMessager');

const app = express();

// set our port
const port = app.locals.port = process.env.PORT || 8080;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(session({
    secret: coffeLight.config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        //secure: true
    }
}));

// routes
app.use('/api/v1/', routes);

app.get('/firebase.js', (req, res) => {
    res.type('text/javascript').send("const firebaseConfig = " + JSON.stringify(coffeLight.config.firebase.web) + ";");
});

app.use(express.static(__dirname + '/public'));


// start app at localhost:8080
const server = http.createServer(app);

const wss = new WebSocket.Server({
    server: server,
    path: "/websocket"
});

wss.on('connection', webSocketRoutes);


server.listen(port, () => {
    console.log(`Listening on ${port}`);
});


function shutdownHandler() {
    console.log("Shutting down");
    let timeout = setTimeout(() => {
        console.error("Could not shutdown in time");
        coffeLight.close().then(() => {
            process.exit(1);
        });
    }, coffeLight.config.shutdownTimeout);

    server.close(() => {
        console.log("Server closed");
        clearTimeout(timeout);
        coffeLight.close().then(() => {
            //console.log(process._getActiveHandles().filter(h=>h._type!=='tty'));
            //console.log(process._getActiveRequests());
            //process.exit(0);
        });
    });
}
process.on('SIGTERM', shutdownHandler);
process.on('SIGINT', shutdownHandler);