import {renderController, Menu, MenuItem} from "peabrain-ui";

function App() {
	return (
		<Menu title="Hello">
			<MenuItem title="test1"/>
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

renderController(<App/>);
