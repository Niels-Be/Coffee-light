const EventEmitter = require("events");

const PacketEmitter = new EventEmitter();

let subscribtions = {};


module.exports = function onWebSocketConnect(ws, req) {

    ws.on('message', (data) => {
        console.log("WebSocket Message: ", typeof data, data);
		
		var msg = {};
		try {
			msg = JSON.parse(data);
		}
		catch (e) {
			ws.send(JSON.stringify({
				error: {
					message: "Could not parse request: " + e
				}
			}));
		}
		
        Object.keys(msg).forEach((key) => {
            if (Array.isArray(msg[key])) {
                msg[key].forEach((m) => PacketEmitter.emit(key, m, ws));
            } else {
                PacketEmitter.emit(key, msg[key], ws);
            }
        });
    });

    ws.on('close', () => {
        //kill all subscribtions
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
    (subscribtions[channel.id] || []).forEach((ws) => {
        ws.send(JSON.stringify(payload));
    });
});

coffeLight.on("close", () => {
    //TODO close all websockets
});