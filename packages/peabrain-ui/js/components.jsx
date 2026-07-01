import {useRef, useState, createContext, useContext, useRefresh, useEffect} from "./reactive-tui.js";
import {useClampedEncoder, useEncoderButton} from "./device-ui.js";

let BackContext=createContext();

export function useEventUpdate(obj, event="change") {
	let refresh=useRefresh();
	useEffect(()=>{
		if (!obj || !obj.on)
			return;

		function handleChange() {
			refresh();
		}

		obj.on(event,handleChange);
		return ()=>{
			obj.off(event,handleChange);
		}
	});
}

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

export function MenuItem({children}) {
	return children;
}

export function Menu({title, children}) {
	function arrayify(a) {
	    if (!a)
	        a=[];

	    if (!Array.isArray(a))
	        a=[a];

	    return a;
	}

	let [selectedIndex,setSelectedIndex]=useState();
	let back=useContext(BackContext);
	children=arrayify(children);

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
				return back();

			else
				index--;
		}

		if (children[index].props.onClick)
			children[index].props.onClick();

		else
			setSelectedIndex(index);
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

export function useIsBootComplete() {
	useEventUpdate(Sys.getInstance(),"bootComplete");
	return (Sys.getInstance().isBootComplete());
}

export function useLatchedError() {
	useEventUpdate(Sys.getInstance(),"latchedErrorChange");
	return (Sys.getInstance().getLatchedError());
}

export function StatusCover({children}) {
	let bootComplete=useIsBootComplete();
	let latchedError=useLatchedError();

	function ErrorDialog() {
		useEncoderButton(()=>Sys.getInstance().dismissError());
		return ["Err:",latchedError,"","    [ Dismiss ]     "];
	}

	function BootErrorDialog() {
		useEncoderButton(()=>Sys.getInstance().scheduleRestart(true));
		return ["Boot Error:",latchedError,"","     [ Reboot ]     "];
	}

	if (!bootComplete && latchedError)
		return <BootErrorDialog />

	if (latchedError)
		return <ErrorDialog />

	if (!bootComplete)
		return ["Booting..."];

	return children;
}