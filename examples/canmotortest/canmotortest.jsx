import {GPIO_PROFILE, MOTOR_PROFILE, openDevice,
		renderController, Menu, MenuItem, ObjectEditor,
		useBack, useEncoderButton} from "peabrain";

function InfoItem({label, value}) {
	let back=useBack();
	useEncoderButton(()=>back());

	return ([label+":",String(value),"","      [ Back ]      "]);
}

function Info() {
	let info=getInfo();
	return (
		<Menu title="System Info">
			{Object.keys(info).map(k=>
				<MenuItem title={k}>
					<InfoItem label={k} value={info[k]}/>
				</MenuItem>
			)}
		</Menu>
	)
}

function App({devices}) {
	return (
		<Menu title="Hello">
			<MenuItem title="Info">
				<Info/>
			</MenuItem>
			<Menu title="CAN Registers">
			</Menu>
		</Menu>
	);
};

//				<ObjectEditor title="Motor" entry={devices.motor.at("targetPosition")} step={100}/>

/*
				<ObjectEditor title="Blink 1" entry={devices.gpio.at("output_1")} max={1}/>
				<ObjectEditor title="Blink 2" entry={devices.gpio.at("output_2")} max={1}/>
*/

let devices={};
/*devices.gpio=openDevice(5,GPIO_PROFILE);
await devices.gpio.awaitState("operational");

devices.gpio.mode_1=1;
devices.gpio.mode_2=1;
await devices.gpio.flush();*/

/*devices.motor=openDevice(91,MOTOR_PROFILE);
await devices.motor.awaitState("operational");
devices.motor.polarity=7; //7;
devices.motor.maxAcceleration=10000;
devices.motor.maxDeceleration=10000;
devices.motor.maxVelocity=16000; //16000;
devices.motor.control=0x0f;
devices.motor.at("targetPosition").refresh();
devices.motor.at("actualPosition").refresh();
await devices.motor.flush();*/

renderController(<App devices={devices}/>);

getBus().on("slcan",s=>{
	console.log("msg: "+s);
});