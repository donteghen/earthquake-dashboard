const WebSocketServer = require('ws').Server; 
const Twit = require('twit');
const {fromEvent} = require('rxjs');

function onConnect(ws) {
    console.log('Client connected on localhost:8080');
}

const server = new WebSocketServer({port:8080})

fromEvent(server, 'connection').subscribe(onConnect);