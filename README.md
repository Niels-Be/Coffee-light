# Coffee-light

## Routes

```
GET /
String representation of coffee status

GET /coffee
Get useres who want coffee
{ reqeusts: [ names... ] }

PUT /coffee
Body: { name: "some name" }
Add `name` to coffee requester list

DELETE /coffee
Clear coffee requester list
```
