import {useEncoderButton, useEncoderDelta} from "./device-ui.js";
import {useEventUpdate, useBack} from "./components.jsx";

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