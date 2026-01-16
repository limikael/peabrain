import {useBack, useEncoderButton, useEncoderDelta} from "peabrain";

export function useCanOpenObject(devId, index, subIndex) {
	return global.getMasterDevice().getRemoteDevice(devId).at(index,subIndex);
}

export function ObjectEditor({name, title, devId, index, subIndex, min, max, step}) {
	let back=useBack();
	useEncoderButton(()=>back());
	let delta=useEncoderDelta();
	let entry=useCanOpenObject(devId,index,subIndex);

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