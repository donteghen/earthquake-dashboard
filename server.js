const WebSocketServer = require('ws').Server; 

const {fromEvent, merge, map} = require('rxjs');


const envInit = require('./src/helpers');
envInit();





const server = new WebSocketServer({port:8080});

const onStatus = (msg) => {
    console.log(msg);
}

// Event for new client connections
const connectionEvent = fromEvent(server, 'connection').pipe(
    map(ws => {
        // Log client connection
        console.log('Client connected on localhost:8080');

        // Handle incoming messages from this client
        fromEvent(ws, 'message').subscribe(data => {
            const message = data.toString(); // Convert data to string
            onStatus( message );
        });

        // Handle client disconnection
        fromEvent(ws, 'close').subscribe(() => {
            console.log('Client disconnected from localhost:8080');
        });

        return 'Client connected on localhost:8080' ;
    })
);
connectionEvent.subscribe(onStatus);




 

