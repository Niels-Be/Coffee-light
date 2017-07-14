# Coffee-light

### Rest API

Rest API is mounted in `/api/v1`. e.g `/api/v1/channels`

```
POST /register
body: { name, token }
Registers the current session and assosiate is with an user

GET /channels
query: { search: "" }
Get all channels with optional filter.

GET /channel
query: {channelId }
Get more details about a channel

PUT /channel
body: { name, password, ttl, requestText, message, title, icon }
Create new channel and subscribe to it

POST /channel
body: { channelId, name, password, ttl, requestText, message, title, icon }
Update an existing channel

POST /channel/subscription
body: { channelId, password }
Subscribe to channel, optional password

DELETE /channel/subscription
body: { channelId }
Unsubscribe from channel

DELETE /channel/notify
body: { channelId }
Notify that channel

GET /subscriptions
Get all subscribed channel ids
```

### Websocket API

WebSocket Endpoint is `/websocket`

Message exchange is in JSON format.
Each message is structured like: `{ cmd: { content } }` while a message can contain multiple cmds and multiple instances of the same cmd by an array.

Towards Server:

- `subscribe: { channelId, password }`
- `unsubscribe: { channelId }`

Towards Client:
- `error: { err }`
- `notification: { notification message }`
- `data: { name, channel, timestamp }`
