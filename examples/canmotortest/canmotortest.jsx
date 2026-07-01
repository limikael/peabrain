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
			<ObjectEditor title="Motor" entry={devices.motor.at("targetPosition")} step={100}/>
			<Menu title="CAN entries">
				<ObjectEditor title="Limit A" entry={devices.motor.at("limitA")} disabled/>
			</Menu>
		</Menu>
	);
};


let devices={};
globalThis.devices=devices;

devices.motor=openDevice(92,MOTOR_PROFILE);
await devices.motor.awaitState("operational");
devices.motor.polarity=7; //7;
/*devices.motor.maxAcceleration=12800;
devices.motor.maxDeceleration=12800;
devices.motor.maxVelocity=12800; //16000;*/
devices.motor.microstep=2;
devices.motor.maxAcceleration=1600*4;
devices.motor.maxDeceleration=1600*4;
devices.motor.maxVelocity=1600*5; //16000;
devices.motor.control=0x0f;
devices.motor.at("targetPosition").refresh();
devices.motor.at("actualPosition").refresh();
devices.motor.at("limitA").subscribe(1);
await devices.motor.flush();

renderController(<App devices={devices}/>);

//getBus().on("slcan",s=>{ console.log("msg: "+s); });