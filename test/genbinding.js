import {peabindGen} from "../api/peabind.js"

await peabindGen({
	descriptionFn: "test/mockbinding.json",
	outputFn: "test/mockbinding.cpp"
});
