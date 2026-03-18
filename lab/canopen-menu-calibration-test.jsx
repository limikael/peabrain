import {renderController, Menu, MenuItem, useBack, useEncoderButton, useRef, useRefresh, useEffect,
		useState} from "peabrain";
import {ObjectEditor} from "./components.jsx";

async function awaitRemoteDeviceValue(nodeId, index, subIndex, value) {
	let master=getMasterDevice();
	let device=master.getRemoteDevice(nodeId);
	let entry=device.at(index,subIndex);

	await new Promise(resolve=>{
		function check() {
			if (entry.get()==value) {
				entry.off("change",check);
				resolve();
			}
		}

		entry.on("change",check);
		check();
	});
}

async function runCalibration({log}) {
	await log("_ Calibration _______");

	await log("Finding neg. stop...");
	await awaitRemoteDeviceValue(4,0x6400,1,0);
	await log("Found at: 123");

	await log("Finding pos. stop...");
	await awaitRemoteDeviceValue(4,0x6400,3,0);
	await log("Found at: 456");

	await log("Complete...");
}

function Job({action}) {
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

		action({log}).then(()=>{
			while (logItems.current.length<2)
				logItems.current.push("");

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

function App() {
	return (
		<Menu title="Flatpak">
			<Menu title="Start Queued Job">
				<Menu title="Job #123"/>
				<Menu title="Job #124"/>
				<Menu title="Job #125"/>
				<Menu title="Job #126"/>
				<Menu title="Job #127"/>
				<Menu title="Job #128"/>
			</Menu>
			<Menu title="Status">
			</Menu>
			<Menu title="Test">
				<ObjectEditor title="Blink 1" address={[3,0x2000,0]} max={1}/>
				<ObjectEditor title="Blink 2" address={[4,0x2000,0]} max={1}/>
				<ObjectEditor title="Switch 1" address={[4,0x6400,1]} max={1}/>
				<ObjectEditor title="Switch 2" address={[4,0x6400,3]} max={1}/>
				<Menu title="Jog Rail Axis"/>
				<Menu title="Jog Vert. Axis"/>
			</Menu>
			<Menu title="Settings">
				<MenuItem title="Calibration">
					<Job action={runCalibration}/>
				</MenuItem>
				<Menu title="Device Homing"/>
			</Menu>
		</Menu>
	);
}

let master=getMasterDevice();
let blinkDevice=master.createRemoteDevice(3);
blinkDevice.insert(0x2000,0);

let gpioDevice=master.createRemoteDevice(4);
gpioDevice.insert(0x2000,0);
gpioDevice.insert(0x6400,1);
gpioDevice.insert(0x6400,2);
gpioDevice.insert(0x6400,3);
gpioDevice.insert(0x6400,4);

renderController(<App/>);

waitFor(async ()=>{
	gpioDevice.at(0x6400,1).subscribe(1).refresh();
	gpioDevice.at(0x6400,3).subscribe(2).refresh();
	await gpioDevice.flush();
});

gpioDevice.at(0x6400,1).on("change",()=>{
	if (!gpioDevice.at(0x6400,1).get())
		blinkDevice.at(0x2000,0).set(1);
});

gpioDevice.at(0x6400,3).on("change",()=>{
	if (!gpioDevice.at(0x6400,3).get())
		blinkDevice.at(0x2000,0).set(0);
});
