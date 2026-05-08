import {renderController, Menu, MenuItem} from "peabrain-ui";
import {openDevice} from "canopener";
import {GPIO_PROFILE} from "peabrain";

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

let d=openDevice(5,GPIO_PROFILE);
await d.awaitState("operational");

d.at("mode_1").setInt(1);
await d.flush();

setInterval(()=>{
	d.output_1=!d.output_1;
},1000);

renderController(<App/>);
