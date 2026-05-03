import {createReactiveTui, useRef} from "./reactive-tui.js";
import {ResolvablePromise} from "./js-util.js";

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
	let valueRef=useRef(min);
	let delta=useEncoderDelta();

	valueRef.current+=delta;
	if (valueRef.current<min)
		valueRef.current=min;

	if (valueRef.current>=max)
		valueRef.current=max-1;

	return valueRef.current;
}

export function useEncoder() {
	let deviceUi=useDeviceUi();

	return getUiKnob().getValue();
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

		getUiKnob().on("change",()=>this.refreshPromise.resolve());
		getUiButton().on("down",()=>{
			this.buttonCount++;
			this.refreshPromise.resolve();
		});
	}

	setLines(lines) {
		let s="";
		for (let i=0; i<4; i++)
			s+=(lines[i]??"").slice(0,20).padEnd(20);

		Lcd.getInstance().setBuffer(s);
	}

	refresh() {
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