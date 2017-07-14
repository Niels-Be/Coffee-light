const EventEmitter = require("events");
const fs = require('fs');

const User = require('./User');
const Channel = require('./Channel');



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
        this.config = config;

        this.channels = [];
        this.channelIdCounter = 1;
        this.users = [];
        this.userIdCounter = 1;

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
        let id = options.id || this.userIdCounter++;

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

        let channel = new Channel(this.channelIdCounter++, options);
        console.log("Created new Channel[%s] %s", channel.id, channel.name);
        this.channels.push(channel);
        return this.save().then(() => channel);
    }

    save() {
        let obj = {
            channels: this.channels,
            channelIdCounter: this.channelIdCounter,
            users: this.users,
            userIdCounter: this.userIdCounter
        };

        return new Promise((resolve, reject) => {
            fs.writeFile(this.config.storageDb, JSON.stringify(obj), (err) => {
                if (err) return reject(err);
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
                obj.users = obj.users.map(u => new User(u.id, u));
                obj.channels = obj.channels.map(c => new Channel(c.id, c));

                Object.assign(this, obj);
                resolve();
            });
        });
    }

    close() {
        return this.save().catch((err) => console.error(err.stack));
    }

}


module.exports = CoffeLight;