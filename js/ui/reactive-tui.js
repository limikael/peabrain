import EventEmitter from "../utils/EventEmitter.js";

export function useState(initial) {
	let reactiveTui=useRenderInstance();
	let ref=useRef(initial);

	function setter(value) {
		ref.current=value;
		reactiveTui.emit("refresh");
	}

	return [ref.current,setter];
}

export function useId() {
	let reactiveTui=useRenderInstance();

	return reactiveTui.renderPath;
}

export function useRef(def) {
	let reactiveTui=useRenderInstance();
	let id=useId();
	let hookIndex=reactiveTui.hookIndex;
	reactiveTui.hookIndex++;

	if (!reactiveTui.refs[id])
		reactiveTui.refs[id]=[];

	if (!reactiveTui.refs[id][hookIndex]) {
		let o={};
		if (def!==undefined)
			o.current=def;

		reactiveTui.refs[id][hookIndex]=o;
	}

	return reactiveTui.refs[id][hookIndex];
}

function useRenderInstance() {
	return ReactiveTui.renderInstance;
}

export function useContext(context) {
	let reactiveTui=useRenderInstance();
	let valueArray=reactiveTui.contexts.get(context);
	if (valueArray)
		return valueArray[valueArray.length-1];
}

export function createContext() {
	let context={};
	context.Provider=({value, children})=>{
		let reactiveTui=useRenderInstance();
		if (!reactiveTui.contexts.get(context))
			reactiveTui.contexts.set(context,[]);

		reactiveTui.contexts.get(context).push(value);

		return children;
	}

	context.Provider.postRender=()=>{
		let reactiveTui=useRenderInstance();
		//console.log("post render",reactiveTui.contexts.get(context));

		reactiveTui.contexts.get(context).pop();
	}

	return context;
}

export class ReactiveTui extends EventEmitter {
	static renderInstance;

	constructor(topComponent) {
		super();
		this.topComponent=topComponent;
		this.refs={};
		this.contexts=new Map();
	}

	renderNode(node, path) {
		if (typeof node=="string" || typeof node=="number") {
			//console.log("return: ",node,String(node));
			return String(node);
		}

		if (Array.isArray(node))
			return node.map((child,i)=>this.renderNode(child,path+"/#"+i));

		let nodePath=path+"/"+node.type.name;
		this.activePaths.push(nodePath);
		this.renderPath=nodePath;
		this.hookIndex=0;
		ReactiveTui.renderInstance.renderPath=nodePath;
		let content=this.renderNode(node.type({children: node.children, ...node.props}),nodePath);
		if (node.type.postRender)
			node.type.postRender();
		ReactiveTui.renderInstance.renderPath=undefined;

		return content;
	}

	render() {
		ReactiveTui.renderInstance=this;

		this.activePaths=[];
		let content=this.renderNode(this.topComponent,"");
		ReactiveTui.renderInstance=null;

		for (let k of Object.keys(this.refs))
			if (!this.activePaths.includes(k))
				delete this.refs[k];

		if (!Array.isArray(content))
			content=[content];

		content=content.flat(Infinity);

		return content;
	}
}

export function createReactiveTui(element) {
	return new ReactiveTui(element);
}