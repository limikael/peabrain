import {renderController, Menu, MenuItem, Job} from "peabrain-ui";

async function runjob({log}) {
	//globalThis.hello.world();

	for (let i=0; i<10; i++) {
		log("hello: "+i);
		await new Promise(r=>setTimeout(r,250));
	}

	globalThis.hello.world();
}

function App() {
	return (
		<Menu title="Main">
			<MenuItem title="generate error">
				<Job action={runjob}/>
			</MenuItem>
		</Menu>
	);
};

renderController(<App/>);
