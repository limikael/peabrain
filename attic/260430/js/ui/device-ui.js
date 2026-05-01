import {createReactiveTui, useRef} from "./reactive-tui.js";
import {ResolvablePromise} from "../utils/js-util.js";

function useDeviceUi() {
	return DeviceUi.instance;
}

export function useEncoderDelta() {
	let encoder=useEncoder();
	let currentRef=useRef();
	if (currentRef.current===undefined)
		currentRef.current=encoder;

	let delta=encoder-currentRef.current;
	if (delta>32)
		delta-=64;

	if (delta<-32)
		delta+=64;

	currentRef.current=encoder;

	return delta;
}

export function useClampedEncoder(min, max) {
	let encoder=useEncoder();
	let currentRef=useRef();
	let valueRef=useRef(min);
	if (currentRef.current===undefined)
		currentRef.current=encoder;

	let delta=encoder-currentRef.current;
	if (delta>32)
		delta-=64;

	if (delta<-32)
		delta+=64;
	//console.log("delta: "+delta);

	valueRef.current+=delta;
	if (valueRef.current<min)
		valueRef.current=min;

	if (valueRef.current>=max)
		valueRef.current=max-1;

	currentRef.current=encoder;
	return valueRef.current;
}

export function useEncoder() {
	let deviceUi=useDeviceUi();

	return getEncoderValue();
}

export function useEncoderButton(fn) {
	let deviceUi=useDeviceUi();
	let ref=useRef();
	if (ref.current!==undefined &&
			ref.current!=deviceUi.buttonCount) {
		fn();
	}

	ref.current=deviceUi.buttonCount;
}

export class DeviceUi {
	constructor(element) {
		this.refreshPromise=new ResolvablePromise();

		this.reactiveTui=createReactiveTui(element);
		this.reactiveTui.on("refresh",()=>this.refreshPromise.resolve());
		this.buttonCount=0;

		setEncoderFunc(()=>this.refreshPromise.resolve());
		setButtonFunc(()=>{
			this.buttonCount++;
			this.refreshPromise.resolve();
		});
	}

	setLines(lines) {
		let s="";

		for (let i=0; i<4; i++) {
			let line=lines[i];
			if (!line)
				line="";

			line=line.padEnd(20);
			line=line.slice(0,20);
			s+=line;
//			displaySetCursor(0,i);
//			displayWrite(line);
		}

		displayUpdate(s);
	}

	refresh() {
		//console.log("refresh, enc="+getEncoderValue());

		DeviceUi.instance=this;
		let content=this.reactiveTui.render();
		this.setLines(content);
	}

	async run() {
		while (1) {
			this.refreshPromise=new ResolvablePromise();
			//console.log("render...");
			this.refresh();
			await this.refreshPromise;
		}
	}
}

export function renderController(element) {
	//console.log("render controller!!!");

	let deviceUi=new DeviceUi(element);
	deviceUi.run().catch(e=>{
		console.log("**** uncaught in render loop ***");
		console.log(e.message);
	});
	return deviceUi;
}