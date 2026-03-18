import {useBack, useEncoderButton, useEncoderDelta, useEffect, useRefresh} from "peabrain";

export function useEntry(entry) {
	let refresh=useRefresh();
	useEffect(()=>{
		function handleChange() {
			refresh();
		}

		entry.on("change",handleChange);
		return ()=>{
			entry.off("change",handleChange);
		}
	});
}

export function ObjectEditor({name, title, entry, min, max, step}) {
	let back=useBack();
	useEncoderButton(()=>back());
	let delta=useEncoderDelta();
	useEntry(entry);

	if (!name)
		name=title;

	if (!min)
		min=0;

	if (!step)
		step=1;

	if (delta) {
		let v=entry.get()+delta*step;
		if (v<min)
			v=min;

		if (v>max)
			v=max;

		entry.set(v);
	}

	return (["",name.padStart(9)+": "+entry.get(),"","      [ Back ]      "]);
}