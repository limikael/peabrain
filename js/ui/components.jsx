import {useRef, useState, createContext, useContext} from "./reactive-tui.js";
import {useClampedEncoder, useEncoderButton} from "./device-ui.js";

let BackContext=createContext();

export function List({title, items, onSelect}) {
	let encoder=useClampedEncoder(0,items.length);
	let scrollTop=useRef(0);
	useEncoderButton(()=>{
		if (onSelect)
			onSelect(encoder);
	});

	let lines=4;
	let res=[];
	if (title) {
		res.push(("= "+title+" ").padEnd(20,"="));
		lines--;
	}

	if (scrollTop.current<encoder-(lines-1))
		scrollTop.current=encoder-(lines-1);

	if (scrollTop.current>encoder)
		scrollTop.current=encoder;

	for (let i=scrollTop.current; i<scrollTop.current+lines; i++) {
		if (items[i]) {
			if (i==encoder)
				res.push("[ "+items[i]+" ]");

			else
				res.push("  "+items[i]);
		}
	}

	return res;
}

export function Menu({title, children}) {
	let [selectedIndex,setSelectedIndex]=useState();
	let back=useContext(BackContext);

	if (selectedIndex!==undefined) {
		function handleBack() {
			//console.log("handling back..");
			setSelectedIndex(undefined);
		}

		return (
			<BackContext.Provider value={handleBack}>
				{children[selectedIndex]}
			</BackContext.Provider>
		);
	}

	function handleSelect(index) {
		if (back) {
			if (!index)
				back();

			else
				setSelectedIndex(index-1);
		}

		else {
			setSelectedIndex(index);
		}
	}

	let items=[];
	if (back)
		items.push("< Back");

	items.push(...children.map(c=>c.props.title));

	return (
			<List title={title}
					items={items}
					onSelect={handleSelect}/>
	);
}

export function useBack() {
	return useContext(BackContext);
}