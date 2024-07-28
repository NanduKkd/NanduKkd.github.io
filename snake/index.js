let canvas, game;
const main = () => {
	game = new Game(canvas, 20, 500)
	game.start();
	document.body.addEventListener('keydown', e => {
		if(e.key==='ArrowDown') game.direction(3);
		else if(e.key==='ArrowUp') game.direction(1);
		else if(e.key==='ArrowRight') game.direction(0);
		else if(e.key==='ArrowLeft') game.direction(2);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	canvas = document.getElementById('canvas');
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	main();
});

window.addEventListener('resize', e => {
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	game?.draw();
});

class Game {
	startTime = 0;
	size;
	initSpeed;
	startTime;
	lastTime;
	lastChangedTime;
	snake = [];
	dir = 0;
	newDir = 0;
	foodPoint;
	failed;
	ctx;
	constructor(canv, size, initSpeed) {
		this.canv = canv;
		this.ctx = canv.getContext('2d');
		this.size = size;
		this.initSpeed = initSpeed;
	}
	makeFood() {
		const points = [];
		for(let i=0; i<this.size; i++) {
			for(let j=0; j<this.size; j++) {
				let inside = false;
				for(let p of this.snake) {
					if(i===p[0] && j===p[0]) {
						this.inside = true;
						break;
					}
				}
				if(!inside) points.push([i,j]);
			}
		}
		this.foodPoint = points[Math.floor(Math.random()*points.length)];
	}
	start() {
		this.startTime = Date.now();
		this.lastChangedTime = this.startTime;
		this.snake = [[2,0], [1,0], [0,0]];
		this.dir = 0;
		this.failed = false;
		this.lastTime = this.startTime;
		this.makeFood();
		this.draw();
		this.step();
	}
	direction(dir) {
		if(this.dir-dir!==-2 && this.dir-dir!==2)
			this.newDir = dir;
	}
	step() {
		if(Date.now()-this.lastTime >= this.initSpeed) {
			this.dir = this.newDir;
			this.lastTime = Date.now();
			const popped = this.snake.pop();
			const start = this.snake[0];
			this.snake.splice(0, 0, [start[0]+(this.dir===0?1:this.dir===2?-1:0), start[1]+(this.dir===1?-1:this.dir===3?1:0)])
			if(this.snake[0][0]===this.foodPoint[0] && this.snake[0][1]===this.foodPoint[1]){
				this.snake.push(popped);
				this.makeFood();
			}
			for(let i=0; i<this.snake.length; i++) {
				const cell = this.snake[i];
				if(cell[0] < 0 || cell[0] >= this.size || cell[1] < 0 || cell[1] >= this.size) {
					this.failed = true;
					break;
				}
				for(let j=0; j<this.snake.length; j++) {
					const ce = this.snake[j];
					if(i!==j && cell[0]===ce[0] && cell[1]===ce[1]) {
						this.failed = true;
						break;
					}
				}
				if(this.failed) break;
			}
			this.draw()
		}
		if(this.initSpeed>150 && Date.now()-this.lastChangedTime > 30000) {
			this.lastChangedTime = Date.now();
			console.log(this.initSpeed);
			this.initSpeed -= 50;
		}
		if(!this.failed) setTimeout(() => this.step(), 50)
	}
	draw() {
		const wh = Math.max(this.canv.clientWidth/3, 400);
		const start = [(this.canv.width-wh)/2, (this.canv.height-wh)/2]
		this.ctx.strokeStyle = '#000'
		this.ctx.lineWidth = 1;
		this.ctx.lineCap = "square";
		this.ctx.clearRect(0, 0, this.canv.clientWidth, this.canv.clientHeight);
		this.ctx.strokeRect(start[0], start[1], wh, wh)
		this.ctx.strokeStyle = '#ddd';
		this.ctx.beginPath();
		for(let i=1; i<this.size; i++) {
			this.ctx.moveTo(start[0]+i*wh/this.size, start[1])
			this.ctx.lineTo(start[0]+i*wh/this.size, start[1]+wh);
			this.ctx.moveTo(start[0], start[1]+i*wh/this.size)
			this.ctx.lineTo(start[0]+wh, start[1]+i*wh/this.size);
		}
		this.ctx.stroke();
		this.ctx.strokeStyle = this.failed?'#f00':'#000'
		this.ctx.lineWidth = 0.5*wh/this.size;
		this.ctx.lineCap = "round";
		this.ctx.beginPath();
		this.ctx.moveTo(start[0]+(this.snake[0][0]+0.5)*wh/this.size, start[1]+(this.snake[0][1]+0.5)*wh/this.size);
		for(let i=1; i<this.snake.length; i++) {
			this.ctx.lineTo(start[0]+(this.snake[i][0]+0.5)*wh/this.size, start[1]+(this.snake[i][1]+0.5)*wh/this.size)
		}
		this.ctx.stroke();
		this.ctx.fillStyle = '#0f0';
		this.ctx.beginPath();
		this.ctx.arc(start[0]+(this.foodPoint[0]+0.5)*wh/this.size, start[1]+(this.foodPoint[1]+0.5)*wh/this.size, 0.2*wh/this.size, 0, 2*Math.PI);
		this.ctx.fill();
		this.ctx.fillStyle = this.failed?'#f00':'#000';
		this.ctx.font = 'bold 24px monospace'
		this.ctx.fillText('Score: '+this.snake.length+(this.failed?'   GAME OVER':''), start[0], start[1]-10);
	}
}
