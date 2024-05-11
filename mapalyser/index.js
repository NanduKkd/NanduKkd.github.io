const available = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomCode = () => {
    let out = '';
    for(let i=0; i<10; i++) {
        out += available[Math.floor(Math.random()*available.length)];
    }
    return out;
}

const onSelectToggle = (tr, td, rerender=true) => {
    if(tr.dataset.pcvalue === td.dataset.value) {
        tr.dataset.pcvalue = '';
        tr.dataset.pccolor = '#fff';
    } else {
        tr.dataset.pcvalue = td.dataset.value;
        tr.dataset.pccolor = td.dataset.color;
    }
    tr.style.backgroundColor = tr.dataset.pccolor;
    if(rerender) {
        render();
        edited();
    }
}

const addPartyModal = () => {
    showModal('add-party-modal');
}

const editParty = (value, name, color, rerender=true) => {
    const p = document.querySelector('#parties-list > div[data-value="'+value+'"]');
    p.dataset.name = name;
    p.dataset.color = color;
    p.querySelector('.color').style.backgroundColor = color;
    p.querySelector('.name').innerText = name;
    const trs = document.querySelectorAll('tbody tr');
    for(let tr of trs) {
        if(tr.dataset.pcvalue === value) {
            tr.dataset.pccolor = color;
            tr.style.backgroundColor = color;
        }
        tr.querySelector('td[data-value="'+value+'"]').dataset.color = color;
    }
    const htd = document.querySelector('thead tr td[data-value="'+value+'"]');
    htd.innerText = name;
    htd.dataset.color = color;
    htd.style.backgroundColor = color;
    if(rerender) {
        render();
        edited();
    }
}

const addParty = (name, color, rerender=true) => {
    const value = randomCode();
    const pl = document.getElementById('parties-list')
    const p = pl.appendChild(document.createElement('div'))
    p.dataset.value = value;
    p.dataset.color = color;
    const pcol = p.appendChild(document.createElement('div'))
    pcol.style.backgroundColor = color;
    pcol.classList.add('color')
    const pname = p.appendChild(document.createElement('div'))
    pname.innerText = name;
    pname.classList.add('name')
    const pebut = p.appendChild(document.createElement('button'))
    pebut.classList.add('icon')
    pebut.appendChild(document.createElement('img')).src = "assets/edit.svg"
    pebut.onclick = () => {
        const edter = document.getElementById('edit-party-modal')
        showModal('edit-party-modal')
        edter.dataset.pvalue = value;
        const edform = edter.querySelector('form');
        edform.partyname.value = pname.innerText;
        edform.color.value = p.dataset.color;
    };
    const pdbut = p.appendChild(document.createElement('button'))
    pdbut.classList.add('icon')
    pdbut.appendChild(document.createElement('img')).src = "assets/delete.svg"
    pdbut.onclick = () => {
        const dlter = document.getElementById('remove-party-modal')
        showModal('remove-party-modal')
        dlter.dataset.pvalue = value;
        document.getElementById('remove-party-name-modal').innerText = pname.innerText;
    };
    const trs = document.querySelectorAll('tbody tr');
    for(let tr of trs) {
        const td = tr.appendChild(document.createElement('td'));
        td.dataset.color = color;
        td.dataset.value = value;
        td.onclick = () => onSelectToggle(tr, td)
    }
    const hrow = document.querySelector('thead tr');
    const htd = hrow.appendChild(document.createElement('td'));
    htd.innerText = name;
    htd.dataset.value = value;
    htd.dataset.color = color;
    htd.style.backgroundColor = color;
    if(rerender) {
        render();
        edited();
    }
    return value;
}
const removeParty = (value, rerender = true) => {
    document.querySelector('#parties-list > div[data-value="'+value+'"]')?.remove();
    const htd = document.querySelector('thead tr td[data-value="'+value+'"]');
    const trs = document.querySelectorAll('tbody tr');
    for(let tr of trs) {
        if(tr.dataset.pcvalue === value) {
            tr.dataset.pccolor = '#fff';
            tr.dataset.pcvalue = '';
            tr.style.backgroundColor = '#fff';
        }
        const td = tr.querySelector('td[data-value="'+value+'"]');
        td.remove();
    }
    htd.remove();
    if(rerender) {
        render();
        edited();
    }
}
let map, geo;
function render() {
    geo.setStyle(feature => ({
        weight: 0.2,
        color: '#000',
        fillColor: document.querySelector('tr[data-pc="'+feature.properties.pc_id+'"]')?.dataset.pccolor || '#fff',
        fillOpacity: 0.9,
    }));
}
function search (text) {
    document.querySelectorAll('tbody tr').forEach(i => {
        i.style.display = i.dataset.state.toLowerCase().indexOf(text) > -1 || i.dataset.pcname.toLowerCase().indexOf(text) > -1 ? 'table-row' : 'none'
    })
}
document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', {attributionControl: false, zoomSnap: 0.3}).setView([22.5, 82.5], 5);
    fetch('geo.json').then(res => res.json()).then(geoJson => {
        const tb = document.querySelector('tbody')
        const ftrs = geoJson.features.map(i => i.properties).sort((a,b) => a.pc_name>b.pc_name?1:a.pc_name<b.pc_name?-1:0)
        for(let i of ftrs) {
            const tr = tb.appendChild(document.createElement('tr'))
            tr.dataset.pc = i.pc_id;
            tr.dataset.pcname = i.pc_name;
            tr.dataset.state = i.st_name;
            tr.dataset.pcvalue = '';
            tr.dataset.pccolor = '#fff';
            tr.appendChild(document.createElement('td')).innerText = i.pc_id;
            tr.appendChild(document.createElement('td')).innerText = i.pc_name;
        }
        geo = L.geoJSON(geoJson, {onEachFeature: (feature, layer) => {
            layer.on('click', e => {
                focusRow(feature.properties.pc_id)
            })
        }})
        geo.addTo(map)
        const dt = localStorage.data;
        if(dt && confirm("Do you want to retrieve previous data? If you cancel, saved data will be lost.")) {
            useCsv(dt, false);
        }
        localStorage.removeItem('data');
        render();
    }).catch(e => console.error(e))
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

function blink(elem) {
    return new Promise(res => {
        elem.style.opacity = 0.1;
        setTimeout(() => {
            elem.style.opacity = 1
            setTimeout(res, 200)
        }, 200)
    })
}

function focusRow (pcid) {
    const elem = document.querySelector('tr[data-pc="'+pcid+'"]');
    elem.scrollIntoView({block: 'center'})
    blink(elem).then(() => blink(elem)).then(() => blink(elem))
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('visible')
}
function showModal(modalId) {
    document.getElementById(modalId).classList.add('visible')
}

function toCsv() {
    const hrow = document.querySelector('thead tr');
    let arr = [];
    let arc = [''];
    let arn = ['PC']
    for(let htd of hrow.querySelectorAll('td')) {
        if(!htd.dataset.value) continue;
        arc.push(htd.dataset.color);
        arn.push(htd.innerText);
    }
    arr.push(arc, arn);
    for(let tr of document.querySelectorAll('tbody tr')) {
        const carr = [tr.dataset.pc];
        for(let td of tr.querySelectorAll('td')) {
            if(!td.dataset.value) continue
            carr.push(tr.dataset.pcvalue===td.dataset.value ? 1 : 0);
        }
        arr.push(carr);
    }
    return arr.map(i => i.join(',')).join('\n')
}

function save() {
    localStorage.data = toCsv();
    window.dataChanged = false;
    document.getElementById('save-icon').disabled = true;
}

function download() {
    const filename = prompt("Enter a name for the file")
    const url = URL.createObjectURL(new Blob([toCsv()], { type: 'text/csv' }));
    downloadURL(url, filename+".csv")
    URL.revokeObjectURL(url);
}

const downloadURL = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
}

function useCsv(csv, rerender=true) {
    const hrow = document.querySelector('thead tr');
    for(let htd of hrow.querySelectorAll('td')) {
        if(!htd.dataset.value) continue;
        removeParty(htd.dataset.value, false)
    }
    const arr = csv.split('\n').map(i => i.split(','));
    const parties = [];
    for(let i=1; i<arr[0].length; i++) {
        parties.push(addParty(arr[1][i], arr[0][i], false));
    }
    for(let i=2; i<arr.length; i++) {
        const pc = arr[i][0];
        const winner = parties[arr[i].indexOf('1')-1];
        if(!winner) continue
        const tr = document.querySelector('tbody tr[data-pc="'+pc+'"]');
        try {
            onSelectToggle(tr, tr.querySelector('td[data-value="'+winner+'"]'), false);
        } catch (error) {
            console.error(error)
            console.log(i, arr[i], tr)
        }
    }
    if(rerender) {
        render();
        edited();
    }
}
function upload () {
    if(window.dataChanged && !confirm("Are you sure to continue? ALl your existing changes will be deleted."))
        return;
    let el = document.createElement("INPUT");
    el.type = "file";
    el.accept = "text/csv";
    el.addEventListener('change', ev2 => {
        if (el.files.length) {
            el.files[0].arrayBuffer().then(r => {
                useCsv(new TextDecoder().decode(r), true)
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
    const m = document.getElementById('map');
    const svg = document.querySelector('#map .leaflet-overlay-pane > svg');
    const sc =  svg.querySelector('g');
    const w = svg.getAttribute('width'), h = svg.getAttribute('height');
    const newSvg = `<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg xmlns="http://www.w3.org/2000/svg" viewBox="${svg.getAttribute('viewBox')}" style="background-color: #ddd" width="${width}" height="${h/w*width}">${sc.innerHTML}</svg>`
    const c = document.createElement('canvas');
    c.width = width;
    c.height = h/w*width;
    c.style.width = width+'px';
    const ct = c.getContext('2d');
    const i = new Image();
    i.onload = e => {
        ct.drawImage(i, 0, 0);
        downloadURL(c.toDataURL(), 'loksabhaAnalysis.png');
    }
    i.onerror = (e,er) => {
        console.error(e)
    }
    i.src = 'data:image/svg+xml;base64,'+btoa(newSvg)
}
