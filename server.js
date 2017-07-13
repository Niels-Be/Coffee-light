const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');


const routes = require('./app/routes');

const app = express();

// set our port
const port = app.locals.port = process.env.PORT || 8080;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(session({
    secret: 'agv45983r80N§/TsadH(§"Eicon3crb',
    resave: false,
    saveUninitialized: false,
    cookie: {
        //secure: true
    }
}));

// routes
app.use('/api/v1/', routes);

app.use(express.static(__dirname + '/public'));


// start app at localhost:8080
app.listen(port);

console.log(`Listening on ${port}`);
module.exports = app;