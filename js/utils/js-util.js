export function safeJsonParse(s) {
	try {
		return JSON.parse(s);
	}

	catch (e) {}
}

export function stringChunkify(str, chunkSize) {
	const chunks = [];
	for (let i = 0; i < str.length; i += chunkSize) {
		chunks.push(str.slice(i, i + chunkSize));
	}
	return chunks;
}

export class ResolvablePromise extends Promise {
    constructor(cb = () => {}) {
        let resolveClosure = null;
        let rejectClosure = null;

        super((resolve,reject)=>{
            resolveClosure = resolve;
            rejectClosure = reject;

            return cb(resolve, reject);
        });

        this.resolveClosure = resolveClosure;
        this.rejectClosure = rejectClosure;
    }

    resolve=(result)=>{
        this.resolveClosure(result);
    }

    reject=(reason)=>{
        this.rejectClosure(reason);
    }
}
