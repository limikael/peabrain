import {renderController, Menu, MenuItem} from "peabrain-ui";

function App() {
	return (
		<Menu title="Hello">
			<MenuItem title="testxxx"/>
			<Menu title="Sub">
				<MenuItem title="sub1"/>
				<MenuItem title="sub2"/>
			</Menu>
			<MenuItem title="test2"/>
			<MenuItem title="test3"/>
			<MenuItem title="test4"/>
		</Menu>
	);
};

let m=getMasterDevice();
let d=m.createRemoteDevice(5);
await d.awaitState("operational");

d.insert(0x2001,1);
d.insert(0x6201,1);
d.at(0x2001,1).setInt(1);
await d.flush();

setInterval(()=>{
	d.at(0x6201,1).setInt(!d.at(0x6201,1).getInt());
},1000);

renderController(<App/>);
