import {useEncoderButton, useEncoderDelta} from "./device-ui.js";
import {useEventUpdate, useBack} from "./components.jsx";
import {useRef, useRefresh, useState, useEffect} from "./reactive-tui.js";

export function ObjectEditor({name, title, entry, min, max, step}) {
	let back=useBack();
	useEncoderButton(()=>back());
	let delta=useEncoderDelta();
	useEventUpdate(entry);

	if (!name)
		name=title;

	if (!min)
		min=0;

	if (!step)
		step=1;

	if (delta) {
		let v=entry.getInt()+delta*step;
		if (v<min)
			v=min;

		if (v>max)
			v=max;

		entry.setInt(v);
	}

	return (["",name.padStart(9)+": "+entry.getInt(),"","      [ Back ]      "]);
}

export function Job({action}) {
	let logItems=useRef([]);	
	let refresh=useRefresh();
	let [complete,setComplete]=useState();
	let back=useBack();
	useEncoderButton(()=>{
		if (complete)
			back();
	});
	useEffect(()=>{
		async function log(s) {
			logItems.current.push(s);
			refresh();
		}

		action({log})
			.then(()=>{
				while (logItems.current.length<2)
					logItems.current.push("");

				setComplete(true);
			})
			.catch(e=>{
				logItems.current.push("Error:");
				logItems.current.push(e.message);
				setComplete(true);
			});
	});

	if (complete) {
		return [
			...logItems.current.slice(-2),
			"",
			"       [ Ok ]       "
		];
	}

	return logItems.current.slice(-4);
}
