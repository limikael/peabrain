import {renderController, useEncoder, useEncoderButton} from "peabrain";

function App() {
	let encoder=useEncoder();
	useEncoderButton(()=>{
		console.log("button!!!");
	});

	return (<>
		hello world: {encoder}
	</>);
}

console.log("starting, calling renderController");

renderController(<App/>);

console.log("render controller called...");
