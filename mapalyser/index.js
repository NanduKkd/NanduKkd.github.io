const available = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomCode = () => {
    let out = '';
    for(let i=0; i<10; i++) {
        out += available[Math.floor(Math.random()*available.length)];
    }
    return out;
}

const onSelectToggle = (tr, td) => {
    if(tr.dataset.pcvalue === td.dataset.value) {
        tr.dataset.pcvalue = '';
        tr.dataset.pccolor = '#fff';
    } else {
        tr.dataset.pcvalue = td.dataset.value;
        tr.dataset.pccolor = td.dataset.color;
    }
    tr.style.backgroundColor = tr.dataset.pccolor;
    render();
}

const addPartyModal = () => {
    showModal('add-party-modal');
}

const editParty = (value, name, color) => {
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
    render();
}

const addParty = (name, color) => {
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
    pebut.appendChild(document.createElement('img')).src = "/assets/edit.svg"
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
    pdbut.appendChild(document.createElement('img')).src = "/assets/delete.svg"
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
    render();
}
const removeParty = (value) => {
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
    render();
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
    map = L.map('map').setView([22.5, 82.5], 5);
    fetch('/geo.json').then(res => res.json()).then(geoJson => {
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
        render();
    }).catch(e => console.error(e))
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


