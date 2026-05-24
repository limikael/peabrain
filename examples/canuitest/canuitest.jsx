import {GPIO_PROFILE, MOTOR_PROFILE, openDevice,
		renderController, Menu, MenuItem, ObjectEditor,
		useBack, useEncoderButton, useEventUpdate} from "peabrain";

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
		<Menu title="Hello">
			<MenuItem title="Info">
				<Info/>
			</MenuItem>
			<MenuItem title="CAN Devices">
				<CanDeviceList/>
			</MenuItem>
		</Menu>
	);
};

let m=getMasterDevice();
let devices={};

renderController(<App devices={devices}/>);

/*getBus().on("slcan",s=>{
	console.log("msg: "+s);
});*/
