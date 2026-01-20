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
global.dev=master.createRemoteDevice(3);
dev.insert(0x2000,0);

global.dev2=master.createRemoteDevice(4);
dev2.insert(0x2000,0);
dev2.insert(0x6400,1);
dev2.insert(0x6400,2);
dev2.insert(0x6400,3);
dev2.insert(0x6400,4);

renderController(<App/>);

waitFor(async ()=>{
	console.log("init!");

	dev2.at(0x6400,1).subscribe(1);
	await dev2.flush();

	/*dev.at(0x2000,0).set(1);
	dev.at(0x2000,0).set(2);
	dev.at(0x2000,0).set(3);
	await dev.flush();*/
	//await dev2.flush();*/

	console.log("flushed...");
});

global.handleChange=()=>{
	console.log("val: "+dev2.at(0x6400,1).get());
}

dev2.at(0x6400,1).onChange(global.handleChange);

/*setInterval(()=>{
	console.log("val: "+dev2.at(0x6400,1).get());
},1000);*/