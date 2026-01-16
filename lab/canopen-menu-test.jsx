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
				<ObjectEditor name="Blink" title="Blink"
					devId={3} index={0x2000} subIndex={0}
					min={0} max={1}/>
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
let dev=master.createRemoteDevice(3);
dev.insert(0x2000,0);

renderController(<App/>);