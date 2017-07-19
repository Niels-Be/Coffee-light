const EventEmitter = require("events");

const PacketEmitter = new EventEmitter();

let subscribtions = {};


module.exports = function onWebSocketConnect(ws, req) {

    ws.on('message', (data) => {
        var msg = {};
        try {
            msg = JSON.parse(data);
        }
        catch (e) {
            return ws.send(JSON.stringify({
                error: {
                    message: "Could not parse request: " + e
                }
            }));
        }

        console.log("Websocket Msg: ", msg);
        
        Object.keys(msg).forEach((key) => {
            let handeled = false;
            if (Array.isArray(msg[key])) {
                handeled = PacketEmitter.listenerCount(key) > 0;
                if (handeled)
                    msg[key].forEach((m) => PacketEmitter.emit(key, m, ws));
            } else {
                handeled = PacketEmitter.emit(key, msg[key], ws);
            }
            if (!handeled) {
                console.log("No handler attached to " + key);
            }
        });
    });

    ws.on('close', () => {
        //kill all subscribtions
        Object.keys(subscribtions).forEach((key) => {
            subscribtions[key] = subscribtions[key].filter(w => w !== ws);
        });
    });

    ws.on('error', (err) => {
        console.error(err.stack);
    });
};

PacketEmitter.on("subscribe", (data, ws) => {
    let channel = coffeLight.getChannel(data.channelId);
    if (!channel) {
        return ws.send(JSON.stringify({
            error: {
                message: "Channel not found"
            }
        }));
    }
    if (channel.password && data.password !== channel.password) {
        return ws.send(JSON.stringify({
            error: {
                message: "Channel password invalid"
            }
        }));
    }

    (subscribtions[channel.id] = subscribtions[channel.id] || []).push(ws);
});

PacketEmitter.on("unsubscribe", (data, ws) => {
    let channel = coffeLight.getChannel(data.channelId);
    if (!channel) {
        return ws.send(JSON.stringify({
            error: {
                message: "Channel not found"
            }
        }));
    }

    subscribtions[channel.id] = (subscribtions[channel.id] || []).filter(w => w !== ws);
});



coffeLight.on("sendToChannel", (channel, payload, options) => {
    (subscribtions[channel.id] || []).forEach((ws, index) => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(payload));
        } else {
            console.log("Websocket Connection is broken"); 
            subscribtions[channel.id].splice(index, 1);
        }
    });
});

coffeLight.on("close", () => {
    //TODO close all websockets
});