import {renderController, Menu, MenuItem} from "peabrain-ui";

function App() {
	return (
		<Menu title="Hello">
			<MenuItem title="test1"/>
			<MenuItem title="test2"/>
			<MenuItem title="test3"/>
			<MenuItem title="test4"/>
		</Menu>
	);
};

renderController(<App/>);
