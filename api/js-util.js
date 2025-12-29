export function safeJsonParse(s) {
	try {
		return JSON.parse(s);
	}

	catch (e) {}
}