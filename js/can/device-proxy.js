function flushRemoteDevice(target) {
	//console.log("flushing, id="+target.getNodeId()+" gen="+target.getGeneration()+" cgen="+target.getCommitGeneration());
	let generation=target.getGeneration();
	if (target.getCommitGeneration()==generation &&
			!target.isRefreshInProgress())
		return;

	return new Promise(resolve=>{
		//console.log("******* will flush...");
		let check=()=>{
			//console.log("check... refreshing: "+target.isRefreshInProgress());

			if (target.getCommitGeneration()>=generation &&
					!target.isRefreshInProgress()) {
				target.off("commitGenerationChange",check);
				resolve();
			}
		}

		target.on("commitGenerationChange",check);
	});
}

function createProfileProxy(device, profile={}) {
	return new Proxy(device, {
		get(target, prop, receiver) {
			//console.log("getting: "+prop);
			if (profile.entries[prop]) {
				let e = profile.entries[prop];
				return target.at(e.index, e.subIndex).get();
			}

			if (prop=="at") {
				return (index, subIndex)=>{
					if (typeof index=="string") {
						let e=profile.entries[index];
						return target.at(e.index,e.subIndex);
					}

					return target.at(index,subIndex);
				};
			}

			if (prop=="flush") {
				return ()=>flushRemoteDevice(target);
			}

			return Reflect.get(target, prop, receiver);
		},

		set(target, prop, value, receiver) {
			//console.log("setting: "+prop+" to: "+value);
			if (profile.entries[prop]) {
				let e = profile.entries[prop];
				target.at(e.index, e.subIndex).set(value);
				return true;
			}
			return Reflect.set(target, prop, value, receiver);
		}
	});
}

function createProfileEntries(device, profile={}) {
	for (let k in profile.entries) {
		let e=profile.entries[k];
		//console.log("e: "+k+" i: "+e.index+" s: "+e.subIndex);
		device.insert(e.index,e.subIndex);
	}

	return device;
}

export function openDevice(deviceId, deviceProfile) {
	let masterDevice=global.getMasterDevice();
	let remoteDevice=masterDevice.createRemoteDevice(deviceId);
	createProfileEntries(remoteDevice,deviceProfile);

	return createProfileProxy(remoteDevice,deviceProfile);
}
