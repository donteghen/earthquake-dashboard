
const {
    Observable, distinct, scan, retry, interval, startWith, of,  take,  takeWhile, takeLast, range, merge, mergeAll, mergeMap, 
    mergeScan, mergeWith, tap, takeUntil, fromEvent, filter, from, concat, first, reduce, EMPTY, pluck, share, bufferTime, identity,
    distinctUntilChanged
} = rxjs;
const mp = rxjs.map;



const codeLayer = {};
const quakeLayer = L.layerGroup([]).addTo(map);
const table = document.getElementById('quakes_info');

function initialize () {    
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

function socketInit () {
    var T = new Twit({
        consumer_key: 'nWs58W51UTQ1U3u09qkspNaSs',
        consumer_secret: 'Tt6TyFaXiv5GGs3fEVpJ4DWcLH7yDCHlXco3jakpgSRVLbLYV0', 
        access_token: '1731555618161352704-ocWvs9BAykuqfUd5r8jVc8hSzPwZM5', 
        access_token_secret: 'DwEdJnhVkZ5dtSaeDJ5CDUc8A3V7Eo8BnkViyQ3SIIhJg',
        timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
        strictSSL:            false,
    });
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

