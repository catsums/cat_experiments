import $ from "jquery";
import * as _ from "lodash";

import * as MY from "@catsums/my";

import anime from "animejs";

import { AnimObject, AnimInstance } from "./animationPlayer";

let currentAnimation:AnimInstance = null;

async function playAnimation(anim:AnimObject, {
	loop = anim.loop,
	speed = anim.speed,
	reverse = anim.reverse,
	fps = anim.fps,

} : {

	loop ?: number,
	speed ?: number,
	reverse ?: boolean,
	fps ?: number,

} = {}){
	return new Promise((resolve, reject) => {
		if(currentAnimation){
			currentAnimation.stop();
		}
		currentAnimation = new AnimInstance(anim, {loop, fps, speed, reverse});
		currentAnimation.on('end', (inst)=>{
			resolve(inst);
		});
	
		currentAnimation.play();
	});
}

let form = $(".form");
let image = $(form).find(".image");
let passBox = $(form).find("#pass");
let showBtn = $(form).find("#showPass");

let showPass = false;
let focus = false;

function setImage(url:string){
	$(image).css({
		'background-image' : `url('${url}')`,
	});
}

let images = {
	unfocus: "assets/frames/f0000.png",
	open: "assets/frames/f0019.png",
	close: "assets/frames/f0012.png",
}
let anims = {
	idle: new AnimObject(".image", {
		fps: 12,
		loop: -1,
		frames:[
			{
				src: 'assets/frames/f0000.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0001.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0002.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0003.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0004.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0005.png',
				hold: 10,
			},
		],
	}),
	idle_hide: new AnimObject(".image", {
		fps: 12,
		frames:[
			{
				src: 'assets/frames/f0005.png',
				hold: 2,
			},
			{
				src: 'assets/frames/f0007.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0009.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0010.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0011.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0012.png',
				hold: 1,
			},
		],
	}),
	idle_show: new AnimObject(".image", {
		fps: 12,
		frames:[
			{
				src: 'assets/frames/f0005.png',
				hold: 2,
			},
			{
				src: 'assets/frames/f0007.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0009.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0010.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0011.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0012.png',
				hold: 1,
			},

			{
				src: 'assets/frames/f0016.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0017.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0018.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0019.png',
				hold: 1,
			},
		],
	}),
	hide_show: new AnimObject(".image", {
		fps: 12,
		frames:[
			{
				src: 'assets/frames/f0012.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0016.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0017.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0018.png',
				hold: 1,
			},
			{
				src: 'assets/frames/f0019.png',
				hold: 1,
			},
		],
	}),
}

// setImage(images.unfocus);
playAnimation(anims.idle);

$(showBtn)
.on("mousedown", (e:Event)=>{
	e.preventDefault();
	e.stopPropagation();
})
.on("click", (e:Event)=>{
	e.preventDefault();
	e.stopPropagation();

	showPass = !showPass;

	if(showPass){
		$(showBtn).text("Hide");
		$(passBox).attr({
			type : "text",
		});
	}else{
		$(showBtn).text("Show");
		$(passBox).attr({
			type : "password",
		});
	}

	if(focus){
		if(showPass){
			// setImage(images.open);
			playAnimation(anims.hide_show);
		}else{
			// setImage(images.close);
			playAnimation(anims.hide_show, {reverse: true});
		}
	}
})

$(passBox).on('focus', (e:Event)=>{
	e.stopPropagation();

	focus = true;
	if(showPass){
		// setImage(images.open);
		playAnimation(anims.idle_show);
	}else{
		// setImage(images.close);
		playAnimation(anims.idle_hide);
	}
}).on('focusout', async (e:Event)=>{
	e.stopPropagation();

	focus = false;
	await playAnimation(anims.idle_hide, {reverse: true});
	await playAnimation(anims.idle);
	// setImage(images.unfocus);
});

