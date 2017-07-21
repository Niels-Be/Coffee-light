const EventEmitter = require("events");
const fs = require('fs');
const uuid = require('uuid/v4');

const User = require('./User');
const Channel = require('./Channel');
const Firebase = require('./FirebaseMessager');



class CodeError extends Error {
    constructor(code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);

        this.code = code;
    }
}

class CoffeLight extends EventEmitter {

    //Events: 
    //   sendToUser(user, payload, options)
    //   sendToChannel(channel, payload, options)
    //   subscribeToChannel(user, channel)
    //   unsubscribeFromChannel(user, channel)


    constructor(config) {
        super();
        this.config = Object.assign({
            externalUrl: "http://localhost:8080/",
            sessionSecret: "ThisIsTheDefaultButItIsRealyRecommenedToChangeThis",
            storageDb: "db.json",
            notifyTimeout: 10*1000,
            shutdownTimeout: 10*1000,
            firebase: {}
        }, config);

        this.channels = [];
        this.users = [];

        this.firebase = Firebase(this, this.config.firebase.admin);

        this.load().catch((err) => {
            console.error(err.stack);
            process.exit(1);
        });
    }

    getUser(id) {
        return this.users.find(u => u.id == id);
    }

    getOrCreateUser(id, options) {
        let user = this.getUser(id);
        if (user) return Promise.resolve(user);
        options.id = id;
        return this.createUser(options);
    }

    createUser(options) {
        if (!options.name) {
            return Promise.reject(new CodeError(400, "User name is required"));
        }
        let id = options.id || uuid();

        let user = new User(id, options);
        console.log("Created new User[%s] %s", user.id, user.name);
        this.users.push(user);
        return this.save().then(() => user);
    }

    getChannel(id) {
        return this.channels.find(c => c.id == id);
    }

    createChannel(options) {
        if (!options.name) {
            return Promise.reject(new CodeError(400, "Channel name is required"));
        }

        let channel = new Channel(uuid(), options);
        console.log("Created new Channel[%s] %s", channel.id, channel.name);
        this.channels.push(channel);
        return this.save().then(() => channel);
    }

    save() {
        let obj = {
            channels: this.channels,
            users: this.users,
        };

        return new Promise((resolve, reject) => {
            fs.writeFile(this.config.storageDb, JSON.stringify(obj), (err) => {
                if (err) return reject(err);
                console.log("App Saved");
                resolve();
            });
        });
    }

    load() {
        if (!fs.existsSync(this.config.storageDb))
            return Promise.resolve();

        return new Promise((resolve, reject) => {
            fs.readFile(this.config.storageDb, (err, data) => {
                if (err) return reject(err);

                let obj = JSON.parse(data);
                obj.channels = obj.channels.map(c => new Channel(c.id, c));
                obj.users = obj.users.map((u) => {
                    //remove unkowen subscriotions
                    let channels = u.subscriptions
                        .map(s => obj.channels.find(c => c.id === s))
                        .filter(c => !!c);
                    u.subscriptions = channels.map(c => c.id);

                    let user = new User(u.id, u);
                    channels.forEach(c => this.emit("subscribeToChannel", user, c));
                    return user;
                });

                Object.assign(this, obj);
                resolve();
            });
        });
    }

    close() {
        this.emit("close");
        return this.save().catch((err) => console.error(err.stack));
    }

}


module.exports = CoffeLight;