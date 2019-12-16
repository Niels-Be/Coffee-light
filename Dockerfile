FROM node

WORKDIR /opt/coffee/
COPY package.json .

RUN npm install

COPY . .

ENTRYPOINT node /opt/coffee/server.js

