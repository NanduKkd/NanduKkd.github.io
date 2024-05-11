const available = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomCode = () => {
    let out = '';
    for(let i=0; i<10; i++) {
        out += available[Math.floor(Math.random()*available.length)];
    }
    return out;
}
let map, geo;
function render() {
    geo.setStyle(feature => ({
        weight: 0.2,
        color: '#000',
        fillColor: '#fff',
        fillOpacity: 0.5,
    }));
}
let line = L.polyline([], {color: 'red'}), startPoint, geoData;
const diff = (lng1, lat1, lng2, lat2) => {
    const d =  Math.sqrt(Math.pow(lng2-lng1,2)+Math.pow(lat2-lat1,2))
    return d;
}
document.addEventListener('keydown', e => {
    if(e.key==='z' && (navigator.platform==='MacIntel'?e.metaKey:e.ctrlKey)) {
        const lc = line.getLatLngs()
        if(lc.length===1) {
            line.setLatLngs([]);
            while(prob = probable.pop()) {
                prob.line?.remove();
                prob.circle?.remove();
            }
        } else if(lc.length > 1) {
            line.setLatLngs(lc.slice(0, lc.length-1));
            markProbable();
        }
    }
})
document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', {attributionControl: false, zoomSnap: 0.5}).setView([26.1433, 91.7898], 10);
    line.addTo(map);
    map.on('click', e => {
        line.setLatLngs([...line.getLatLngs(), e.latlng]);
        markProbable();
        edited();
        return false;
    })
    fetch('geo.json').then(res => res.json()).then(res => {
        geoData = res;
        line.setLatLngs([]);
        geo = L.geoJSON(geoData)
        //geo = L.geoJSON(geoData)
        geo.addTo(map)
        render();
    })
    window.addEventListener('beforeunload', (e) => {
        if(!window.dataChanged)
            return '';
        // For IE and Firefox prior to version 4
        if (e) {
            e.returnValue = 'All your data will be lost. Continue?';
        }
        // For Safari
        return e.returnValue;
    })
})

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('visible')
}
function showModal(modalId) {
    document.getElementById(modalId).classList.add('visible')
}

function save() {
    let prob;
    for(let i of geoData.features) {
        if((prob = probable.find(j => j.id===i.properties.pc_id)) && prob.line) {
            const big = Math.max(prob.start, prob.end), small = Math.min(prob.start, prob.end);
            const points = line.getLatLngs().map(j => [j.lng, j.lat]);
            if(prob.straight) {
                i.geometry.coordinates[0][0] = [
                    ...i.geometry.coordinates[0][0].slice(0, small),
                    ...big===prob.start?points.reverse():points,
                    ...i.geometry.coordinates[0][0].slice(big+1),
                ];
            } else {
                i.geometry.coordinates[0][0] = [
                    ...i.geometry.coordinates[0][0].slice(small+1, big),
                    ...small===prob.start?points.reverse():points,
                ];
            }
        }
    }
    geo.clearLayers();
    line.setLatLngs([]);
    while(prob = probable.pop()) {
        prob.line?.remove();
        prob.circle?.remove();
    }
    geo.addData(geoData);
    render();
}

function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(geoData)], { type: 'application/json' }));
    downloadURL(url, "geo.json")
    URL.revokeObjectURL(url);
}

const downloadURL = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
}
function upload () {
    if(window.dataChanged && !confirm("Are you sure to continue? ALl your existing changes will be deleted."))
        return;
    let el = document.createElement("INPUT");
    el.type = "file";
    el.accept = "application/json";
    el.addEventListener('change', ev2 => {
        if (el.files.length) {
            el.files[0].arrayBuffer().then(r => {
                geoData = JSON.parse(new TextDecoder().decode(r));
                line.setLatLngs([]);
                while(prob = probable.pop()) {
                    prob.line?.remove();
                    prob.circle?.remove();
                }
                geo.clearLayers();
                geo.addData(geoData)
                geo.addTo(map)
                render();
            })
        }
    });
    el.click();
}

function edited() {
    if(!window.dataChanged) {
        document.getElementById('save-icon').disabled = false;
        document.getElementById('save-icon').disabled = false;
        window.dataChanged = true;
    }
}

async function saveImage (width = 2160) {
}

let probable = [];

const drawSmallestMap = (coordinates, oneIndex, otherIndex) => {
    const small = Math.min(oneIndex, otherIndex), big = Math.max(oneIndex, otherIndex);
    const straight = big - small < coordinates.length - big + small;
    return {
        straight,
        points: straight ? coordinates.slice(small, big+1) : [...coordinates.slice(big, coordinates.length), ...coordinates.slice(0, small+1)],
    };
}

function markProbable () {
    const lc = line.getLatLngs();
    for(let i of geoData.features) {
        const fexist = probable.find(j => j.id === i.properties.pc_id);
        let foundNow = false;
        for(let j=0; j<i.geometry.coordinates[0][0].length; j++) {
            const c = i.geometry.coordinates[0][0][j]
            if(!fexist && diff(...c, lc[0].lng, lc[0].lat) < 0.005) {
                const circle = L.circle({lng: c[0], lat: c[1]}, {radius: 1});
                circle.addTo(map)
                probable.push({start: j, circle, id: i.properties.pc_id});
                foundNow = true;
            } else if(fexist && j!==fexist.start && diff(...c, lc[lc.length-1].lng, lc[lc.length-1].lat) < 0.005) {
                if(fexist.circle) {
                    fexist.circle.remove();
                    delete fexist.circle;
                }
                fexist.end = j;
                const pData = drawSmallestMap(i.geometry.coordinates[0][0], fexist.start, j);
                const points = pData.points.map(i => ({lat: i[1], lng: i[0]}));
                fexist.straight = pData.straight;
                if(fexist.line) {
                    fexist.line.setLatLngs(points)
                } else {
                    fexist.line = L.polyline([], {color: 'green'})
                    fexist.line.addTo(map);
                    fexist.line.setLatLngs(points)
                }
                foundNow = true;
                break;
            }
        }
        if(!foundNow && fexist?.line) {
            fexist.line.remove();
            delete fexist.line
        }
    }
}
