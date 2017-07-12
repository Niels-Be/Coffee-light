const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./app/routes');

const app = express();

// set our port
const port = process.env.PORT || 8080;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// routes
app.use('/', routes);

// start app at localhost:8080
app.listen(port);

console.log(`Listening on ${port}`);
module.exports = app;