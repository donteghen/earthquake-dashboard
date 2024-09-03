const {Server, WebSocket} = require('ws'); 

const {fromEvent, merge, map} = require('rxjs');


const envInit = require('./src/helpers');
envInit();



const server = new Server({port:8080});

const onData = (data) => {    
    if (data) {
        return analyzeData(data)
    }
       
}

// Event for new client connections
fromEvent(server, 'connection').pipe(
    map(ws => {             
        fromEvent(ws, 'message').pipe(
            map(event => JSON.parse(event.data)),
        ).subscribe((data) => {                      
            const res = onData(data);
            if (res.length > 0) {
                ws[0].send(JSON.stringify(res), function(err) {
                    if (err) {
                        console.log('There was an error sending the message');
                    } 
                });
            }
        });

        // Handle client disconnection
        fromEvent(ws, 'close').subscribe(() => {
            console.log('Client disconnected from localhost:8080');
        });
        return ws;
    })
).subscribe(() => {});


function analyzeData ({quakes}) {
    const highRightQuakes = quakes.filter(quake => quake.mag > 3) ;
    return highRightQuakes;    
}

 

