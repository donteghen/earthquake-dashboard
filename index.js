
const {
    Observable, distinct, scan, retry, interval, startWith, of,  take,  takeWhile, takeLast, range, merge, mergeAll, mergeMap, 
    mergeScan, mergeWith, tap, takeUntil, fromEvent, filter, from, concat, first, reduce, EMPTY, pluck, share, bufferTime, identity,
    distinctUntilChanged
} = rxjs;
const {webSocket} = rxjs.webSocket;
const mp = rxjs.map;



const codeLayer = {};
const quakeLayer = L.layerGroup([]).addTo(map);
const table = document.getElementById('quakes_info');

function initialize () {   
    const socket = webSocket('ws://127.0.0.1:8080');
    socket.subscribe({
        next: message => {
            console.log('Received from server:', message);
        },
        error: e => {
            console.log('WebSocket error:', e);
            if (e.type === 'close') {
                console.log('WebSocket closed!');
            }
        }
    });
    const quakes = new Observable(observer => { 
        window.eqfeed_callback = function(response) {
            const quakes = response.features; 
            observer.next(quakes);
            observer.complete();
        };
        loadJSONP(QUAKE_URL);
    });
 
    const mapQuakes$ = quakes
    .pipe(
        mergeMap(list => from(list)), 
        retry(3)        
    )
    
    const quakes$ = interval(2000).pipe(
        mergeMap(x => mapQuakes$),
        distinct(quake => quake.properties.code),
        share()       
    )
    const tableQuakes$ = quakes$.pipe(
        pluck('properties'),
        mp(makeRow),
        bufferTime(500),
        filter(bufferedRows => bufferedRows.length > 0),
        mp(bufferedRows => {
            const fragment = document.createDocumentFragment();
            bufferedRows.forEach(row => {
                fragment.appendChild(row);
            });
            return fragment;
        })
    )
    //for sockets
    quakes$.pipe(
        bufferTime(500)
    ).subscribe(quakes => {
        console.log('quakes.length', quakes.length)
        const quakeData = quakes.map(quake => {
            return {
                id: quake.properties.net + quake.properties.code, 
                lat: quake.geometry.coordinates[1],
                lng: quake.geometry.coordinates[0],
                mag: quake.properties.mag
            }
        });
        socket.next(JSON.stringify({ quakes: quakeData }));
    })

    quakes$.subscribe({
        next: (quake) => {        
            const coords = quake.geometry.coordinates; 
            const size = quake.properties.mag * 10000;
            const circle = L.circle([coords[1], coords[0]], size).addTo(map); 
            quakeLayer.addLayer(circle);
            codeLayer[quake.id] = quakeLayer.getLayerId(circle);
        }
    });

    
    tableQuakes$.subscribe({
        next: (fragment) => {                 
            const rows = [].slice.call(fragment.children);
            rows.forEach(row => {
                const circle = quakeLayer.getLayer(codeLayer[row.id]);
                isHovering(row).subscribe(hovering => {   
                    circle.setStyle({ color: hovering ? '#ff0000' : '#0000ff' });
                });
                fromEvent(row, 'click').subscribe(x => {
                    map.panTo(circle.getLatLng());
                }) 
            })
            table.appendChild(fragment); 
        }
    })
    
}


// helpers
function isHovering (element) {
    const over = fromEvent(element, 'mouseover').pipe(mp(x => {        
        return identity(true)
    }))
    const out = fromEvent(element, 'mouseout').pipe(mp(x => {
        return identity(false)
    }));
    return merge(over, out)
}

function makeRow(props) {    
    const row = document.createElement('tr'); 
    row.id = props.net + props.code;
    const date = new Date(props.time);
    const time = date.toString();
    [props.place, props.mag, time].forEach(function(text) {
        const cell = document.createElement('td'); 
        cell.textContent = text; 
        row.appendChild(cell);
    });
    return row; 
}




window.addEventListener('DOMContentLoaded', initialize);

