import {GPIO_PROFILE, MOTOR_PROFILE, openDevice,
		renderController, Menu, MenuItem, ObjectEditor,
		useBack, useEncoderButton, useEventUpdate, StatusCover} from "peabrain";

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

function CanDeviceList() {
	useEventUpdate(getMasterDevice(),"devicesChanged");
	let deviceIds=getMasterDevice().getConnectedDeviceIds();
	return (
		<Menu title="CAN Devices">
			{deviceIds.map(id=>
				<MenuItem title={"Device "+id}>
					<InfoItem label={"Device "+id} value={"Connected"}/>
				</MenuItem>
			)}
		</Menu>
	)
}

function App({devices}) {
	return (
		<StatusCover>
			<Menu title="Hello">
				<MenuItem title="Info">
					<Info/>
				</MenuItem>
				<MenuItem title="CAN Devices">
					<CanDeviceList/>
				</MenuItem>
			</Menu>
		</StatusCover>
	);
};

let m=getMasterDevice();
let devices={};

devices.gpio=openDevice(5,GPIO_PROFILE);
renderController(<App devices={devices}/>);

await devices.gpio.awaitState("operational");

devices.gpio.mode_1=1;
devices.gpio.mode_2=1;
await devices.gpio.flush();

//awfawawef();