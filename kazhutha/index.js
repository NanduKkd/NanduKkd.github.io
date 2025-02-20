const types = ['c', 'h', 's', 'd'];
const numbers = ['1','2','3','4','5','6','7','8','9','J','Q','K','A'];
const cards = [];
for(let i of types) {
	for(let j of numbers) {
		cards.push(i+j);
	}
}
let peopleDivs = {}, spentDivs = [], otherItems = [], newRoundItems = [], peoples = {};
let spentContainer, newRoundDiv;

let peopleData = [], spentCards = [];

let newRound = [];



const makeUniqueCardsContainer = (itemsContainer, items, marked = {}, onClick) => {
	const markedCards = {};
	const children = [...itemsContainer.children]
	for(let j of children) {
		if(items.indexOf(j.dataset.card)===-1) {
			j.remove();
		} else {
			markedCards[j.dataset.card] = true
			marked[j.dataset.card] = true
		}
	}
	for(let j of items) {
		if(!markedCards[j]) {
			const newDiv = itemsContainer.appendChild(document.createElement('div'));
			newDiv.dataset.card = j;
			newDiv.innerText = j;
			if(onClick)
				newDiv.onclick = () => onClick(j);
			marked[j] = true
		}
	}
}



function render() {
	const usedCards = {};
	for(let i of peopleData) {
		makeUniqueCardsContainer(peoples[i.id], i.cards, usedCards, putDown);
	}

	makeUniqueCardsContainer(spentContainer, spentCards, usedCards);

	makeUniqueCardsContainer(newRoundDiv, newRound, usedCards, cancelPutDown);

	for(let i of otherItems) {
		i.dataset.marked = usedCards[i.dataset.card] ? 'yes' : 'no';
	}
}

function putDown(item) {
	if(newRound.indexOf(item)===-1)
		newRound.push(item);
	peopleData = peopleData.map(i => ({...i, cards: i.cards.filter(j => j!==item)}));
	render();
}

function cancelPutDown(item, toPerson) {
	newRound = newRound.filter(i => i!==item)
	if(toPerson) {
		peopleData = peopleData.map(i => i.id===toPerson ? {...i, cards: [item, ...i.cards]} : i)
	}
	render();
}

function roundExit(forPerson) {
	if(!forPerson) {
		spentCards = [...spentCards, ...newRound];
	} else {
		for(let i of peopleData) {
			if(i.id===forPerson) {
				i.cards = [...i.cards, ...newRound];
				break;
			}
		}
	}
	newRound = [];
	render();
}
function askRoundExit() {
	val = prompt('To Whom?');
	if(val!==' ') {
		val = parseInt(val);
		if(isNaN(val) || val < 1 ||  val>peopleData.length ) {
			askRoundExit();
		}
	}
	roundExit(val===' ' ? null : val);
}

document.addEventListener('DOMContentLoaded', () => {
	let count, you;
	while (!count || isNaN(count)) {
		count = Number(prompt('How many people?'));
	}
	while (!you || isNaN(you) || you>count || you < 1) {
		you = Number(prompt('Which one is you?'));
	}

	const pe = document.getElementById('peoples');
	for(let i=0; i<count; i++) {
		peopleData.push({id: i+1, cards: []});
		const personContainer = pe.appendChild(document.createElement('div'));
		if(i+1 === you)
			personContainer.dataset.you = 'yes';
		peoples[i+1] = personContainer.appendChild(document.createElement('div'));
		peopleDivs[i+1] = [];
		const personName = personContainer.appendChild(document.createElement('span'));
		personName.innerText = 'Person '+(i+1);
		for(const type of types) {
			const label = personName.appendChild(document.createElement('label'));
			label.innerText = type
			const value = label.appendChild(document.createElement('input'));
			value.type = 'checkbox';
		}
	}
	const otherItemsDiv = document.getElementById('otherItems');
	for(let i of cards) {
		const newCard = otherItemsDiv.appendChild(document.createElement('div'));
		otherItems.push(newCard);
		newCard.innerText = i;
		newCard.dataset.card = i;
		newCard.onclick = () => putDown(i);
	}
	newRoundDiv = document.getElementById('newRoundDiv');
	spentContainer = document.getElementById('spentItems');
	render();
});
