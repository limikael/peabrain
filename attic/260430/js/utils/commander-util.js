export function withUnified(handler) {
	return (...args) => {
		const cmd = args[args.length - 1];     // last param is always command
		const argValues = args.slice(0, -1);   // everything except command

		const optionValues = cmd.optsWithGlobals();

		// Get argument names from Commander
		const argDefs = cmd._args; // internal but stable
		const argObject = {};

		argDefs.forEach((argDef, index) => {
			argObject[argDef.name()] = argValues[index];
		});

		const unified = {
			...optionValues,
			...argObject
		};

		return handler(unified, cmd);
	};
}