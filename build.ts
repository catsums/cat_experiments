import * as esbuild from 'esbuild';
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin';
import util from 'util';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';

interface IObject<T=any>{
	[key:string] : T;
}

const exec = util.promisify(child_process.exec);

const Settings = {
	watch: false,
}

process.argv.forEach(function (val) {
	switch(val.toLowerCase()){
		case '--watch':
			Settings.watch = true;
			break;
		default:
			break;
	}
});

let _default = {
	bundle: true,
	platform: 'neutral',
	plugins: [],
	minify: false,
	keepNames: true,
}

let data : any = [
	{
		_id: `js`,
		entryPoints: ['./src/*.ts'],
		outdir: `./public/js`,
		platform: "node",
	},
	{
		_id: `css`,
		entryPoints: ['./src/*.scss','./src/*.css'],
		outdir: `./public/css`,
		plugins: [
			sassPlugin({
				filter: /\.scss$/
			}),
		],
		bundle: false,
	},
];

async function Build(){

	let opts = data.map(function(d){
		let opt : IObject = Object.assign({}, _default);

		for(let k of Object.keys(d)){
			if(k.startsWith('_')) continue;
			if(k.startsWith('#')) continue;
			opt[k] = d[k];
		}

		let id = d._id;

		if(!opt.plugins){
			opt.plugins = [];
		}
		
		opt.plugins.push({
			name: 'env',
			setup(build){
				build.onEnd(async function(result){
					console.log(`> Built ${id}`);
				});
			}
		});

		console.log(`> Processed ${id}`);
		return opt;

	});

	let ctxs : Promise<esbuild.BuildContext|esbuild.BuildResult>[] = opts.map(async(d, i, arr)=>{
		if(Settings.watch){
			return await esbuild.context(d);
		}
		return await esbuild.build(d);
	});
	
	if(Settings.watch){
		Promise.all(ctxs).then(async(res)=>{
			let arr = res as esbuild.BuildContext[];
			arr.forEach((ctx)=>{
				ctx.watch();
			});
			console.log("watching...");
		});
	}
	
}

Build();