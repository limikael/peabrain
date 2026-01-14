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