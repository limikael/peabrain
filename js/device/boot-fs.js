global.readdir=(p)=>{
	let f=fileOpen(p,"r");
	let a=[];

	let s=fileReadDirEnt(f);
	while (s) {
		a.push(s);
		s=fileReadDirEnt(f);
	}

	fileClose(f);

	return a;
}
