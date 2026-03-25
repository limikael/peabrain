import {renderController, Menu, openDevice, GPIO_PROFILE, MOTOR_PROFILE} from "peabrain";
import {ObjectEditor} from "./components.jsx";

function App({devices}) {
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
				<ObjectEditor title="Blink 1" entry={devices.gpio.at("output_1")} max={1}/>
				<ObjectEditor title="Blink 2" entry={devices.gpio.at("output_2")} max={1}/>
				<ObjectEditor title="BTN" entry={devices.gpio.at("input_3")} max={1}/>
				<ObjectEditor title="Motor" entry={devices.motor.at("targetPosition")} step={100}/>
			</Menu>
			<Menu title="Settings">
				<Menu title="Wifi Settings"/>
				<Menu title="Device Homing"/>
			</Menu>
		</Menu>
	);
}

waitFor(async ()=>{
	let devices={};
	global.devices=devices;
	devices.gpio=openDevice(7,GPIO_PROFILE);
	devices.gpio.mode_1=1;
	devices.gpio.mode_2=1;
	devices.gpio.mode_3=2; //input_pullup
	devices.gpio.at("input_3").subscribe(1).refresh();
	devices.gpio.at("input_3").on("change",()=>{
		devices.gpio.output_1=devices.gpio.input_3;
	});

	await devices.gpio.flush();

	devices.motor=openDevice(32,MOTOR_PROFILE);
	devices.motor.polarity=7;
	devices.motor.maxAcceleration=2000;
	devices.motor.maxDeceleration=2000;
	devices.motor.maxVelocity=10000; //16000;
	devices.motor.control=0x0f;
	devices.motor.at("targetPosition").refresh();
	devices.motor.at("actualPosition").refresh();

	await devices.motor.flush();

	renderController(<App devices={devices}/>);
});

