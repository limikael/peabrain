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

global.readFile=(fn)=>{
	let fid=fileOpen(fn,"r");
	let s="",chunk;

	do {
		chunk=fileRead(fid,64);
		s+=chunk;
	} while (chunk.length)

	fileClose(fid);
	return s;
}
