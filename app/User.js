class User {
    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.tokens = new Set(options.tokens || []);
        this.subscribtions = new Set(options.subscribtions || []);

        if (options.token)
            this.addToken(options.token);
    }

    addToken(token) {
        this.tokens.add(token);
    }

    revokeToken(token) {
        this.tokens.delete(token);
    }

    subscribe(channel) {
        channel.subscribtions++;
        this.subscribtions.add(channel.id);
        coffeLight.emit("subscribeToChannel", this, channel);
    }

    unsubscribe(channel) {
        channel.subscribtions--;
        this.subscribtions.delete(channel.id);
        coffeLight.emit("unsubscribeFromChannel", this, channel);
    }

    send(payload, options) {
        coffeLight.emit("sendToDevice", this, payload, options);
    }
}

module.exports = User;