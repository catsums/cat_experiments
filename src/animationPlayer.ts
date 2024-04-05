
import $ from 'jquery';

import _ from "lodash";
import * as MY from "@catsums/my";

interface IAnimFrameData {
	src: string,
	hold: number,
}

export class AnimObject {
	id:string = MY.randomID('Anim-');
	target: string | Element;
	loop = 0;
	fps: number = 24;
	speed:number = 1.0;
	reverse:boolean = false;
	frames: IAnimFrameData[];

	constructor(target: string|Element, {loop=0, fps=24, speed=1.0, frames=[], reverse=false} : {
		loop ?: number,
		fps ?: number,
		speed ?: number,
		reverse ?: boolean,
		frames ?: IAnimFrameData[]
	} = {}) {
		this.target = target;
		this.loop = loop;
		this.speed = speed;
		this.fps = fps;
		this.reverse = reverse;

		this.frames = frames;
	}
}

type TAnimHandler<T=AnimInstance> = (inst ?: T)=>{};

export class AnimInstance extends EventTarget {
	id:string = MY.randomID('AnimInst-');
	animation: AnimObject;

	target: string | Element;
	loop = 0;
	fps: number;
	speed: number = 1;
	reverse:boolean = false;
	
	frames: string[];
	
	timeElapsed:number = 0;
	lastTime:number = 0;
	lastFrame:number = 0;
	frame: number = 0;

	pre:number = 0;

	isPlaying:boolean = false;

	eventListeners: {
		start: Map<TAnimHandler, TAnimHandler>;
		update: Map<TAnimHandler, TAnimHandler>;
		frame: Map<TAnimHandler, TAnimHandler>;
		loop: Map<TAnimHandler, TAnimHandler>;
		end: Map<TAnimHandler, TAnimHandler>;
	} = {
		start : new Map(),
		update : new Map(),
		frame : new Map(),
		loop : new Map(),
		end : new Map(),
	}

	requestedFrame: number = 0;

	get frameTime(){
		return (1 / this.fps);
	}
	
	get numOfFrames(){
		return this.frames.length;
	}
	get totalTime() {
		return this.numOfFrames / this.fps;
	}

	get progress() {
		return this.timeElapsed / this.totalTime;
	}


	constructor(animation:AnimObject, {speed=animation.speed, loop=animation.loop, target=animation.target, fps=animation.fps, reverse=animation.reverse}:{
		speed?: number,
		loop?: number,
		fps?: number,
		reverse?: boolean,
		target?: string | Element,
	} = {}){
		super();

		this.animation = animation;
		this.target = target;
		this.loop = loop;
		this.fps = fps;
		this.speed = speed;
		this.reverse = reverse;

		this.pre = this.fps;

		this.compileFrames(animation.frames);
	}

	async compileFrames(data:IAnimFrameData[]){
		let frames:string[] = [];

		for(let dat of data){
			let src = dat.src;
			for(let i=0; i<dat.hold; i++){
				frames.push(src);
			}
		}

		this.frames = frames;
	}

	async playFrame(){
		let currTime = performance.now()/1000;
		let delta = currTime - this.lastTime;

		if(this.pre <= 0){
			await this.process(delta);
			this.handle(this.eventListeners.update, this);
		}else{
			this.pre--;
		}
		
		if(this.isPlaying){
			this.lastTime = currTime;
			let func = this.playFrame.bind(this);
			this.requestedFrame = requestAnimationFrame(func);
		}
	}
	async process(delta: any){
		if(this.progress <= 0){
			this.handle(this.eventListeners.start, this);
		}

		this.timeElapsed += delta * this.speed;

		if(this.progress >= 1){
			if(this.loop > 0) this.loop--;

			if(this.loop == 0){
				this.handle(this.eventListeners.end, this);
				this.isPlaying = false;
				return;
			}

			this.timeElapsed = this.timeElapsed % this.totalTime;
			
			this.handle(this.eventListeners.loop, this);
		}

		let frameCount = Math.floor(this.timeElapsed / this.frameTime);

		let currFrame = (frameCount % this.numOfFrames);
		if(this.reverse){
			currFrame = (this.numOfFrames - currFrame - 1) % this.numOfFrames;
		}

		if(currFrame != this.lastFrame){
			// $('.frameNumber').text(`${currFrame}`);

			this.changeFrame(currFrame);

			this.lastFrame = currFrame;

			this.handle(this.eventListeners.frame, this);
		}

		this.frame = currFrame;
	}

	async changeFrame(currFrame:number){
		let frameImage = this.frames[currFrame];

		await new Promise((resolve, reject) => {
			let img = new Image();
			img.onload = () => resolve('');
			img.src = frameImage;
		});

		$<any>(this.target).css({
			'background-image' : `url('${ frameImage }')`,
		});
		$<any>(this.target).attr({
			'src' : `${ frameImage }`,
		});
	}

	async play(){
		this.isPlaying = true;

		this.lastTime = performance.now()/1000;
		let func = this.playFrame.bind(this);
		this.requestedFrame = requestAnimationFrame(func);
	}
	pause(){
		cancelAnimationFrame(this.requestedFrame);
		this.isPlaying = false;
	}

	reset(){
		this.timeElapsed = 0;
		this.lastTime = 0;
		this.lastFrame = 0;
		this.frame = 0;
		this.loop = this.animation.loop;
	}

	stop(){
		this.pause();
		this.reset();
	}

	handle(listeners: Map<TAnimHandler,TAnimHandler>, data:any){
		let arr = listeners.values();
		for(let handler of arr){
			try{
				handler(data);
			}catch(err){
				console.error(err);
			}
		}
	}

	on(event:string, callback: (inst ?: AnimInstance)=>void){
		this.addEventListener(event, callback as any);
	}
	off(event:string, callback: (inst ?: AnimInstance)=>void){
		this.removeEventListener(event, callback as any);
	}

	addEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		if(this.eventListeners[type]){
			let map : Map<any,any> = this.eventListeners[type];
			map.set(callback,callback);
		}
		// super.addEventListener(type, callback, options);
	}
	removeEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		if(this.eventListeners[type]){
			let map : Map<any,any> = this.eventListeners[type];
			map.delete(callback);
		}
		// super.removeEventListener(type, callback, options);
	}
	
}

// let anim = {
// 	element: '.image',
// 	type: 'fxf',
// 	fps: 12,
// 	frames: [
// 		{
// 			src: './f1.png',
// 			hold: 1,
// 		},
// 	],
// 	loop: false,
// }

// let instance = {
// 	id: MY.randomID(),
// 	animation: anim,
// 	progress: 0,
// 	loop: false,
// 	timeElapsed: 0,
// 	lastTime: 0,
// 	data : {
// 		fps: 12,
// 		frame: 0,
// 		numOfFrames: 0,
// 	}
// }

// let lastTime = performance.now()/1000;
// let frame = 0;
// let timeElapsed = 0;
// let fps = 12;
// let lastFrame = -1;
// let numOfFrames = 30;
// let loop = false;
// let speed = 1;
// let progress = 0;
// let totalTime = (numOfFrames / fps);

// let pre = fps;
// export async function playFrame(){
// 	async function run(delta:number){
// 		timeElapsed += delta * speed;
// 		progress = timeElapsed / totalTime;
		
// 		let frameCount = Math.floor(timeElapsed / (1/fps));

// 		if(progress >= 1){
// 			if(!loop){
// 				return;
// 			}
// 			timeElapsed = timeElapsed % totalTime;
// 		}

// 		let currFrame = (frameCount % numOfFrames);

// 		if(currFrame != lastFrame){
// 			$('.frameNumber').text(`${currFrame}`);
// 			lastFrame = currFrame;
// 		}
// 	}

// 	let currTime = performance.now()/1000;
// 	let delta = currTime - lastTime;

// 	if(pre <= 0){
// 		await run(delta);
// 	}else{
// 		pre--;
// 	}
	
// 	lastTime = currTime;
// 	requestAnimationFrame(playFrame);
// }

