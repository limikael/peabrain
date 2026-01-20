import {renderController, Menu} from "peabrain";
import {ObjectEditor} from "./components.jsx";

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
				<Menu title="Jog Rail Axis"/>
				<Menu title="Jog Vert. Axis"/>
			</Menu>
			<Menu title="Settings">
				<Menu title="Wifi Settings"/>
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
	gpioDevice.at(0x6400,1).subscribe(1);
	gpioDevice.at(0x6400,3).subscribe(2);
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
