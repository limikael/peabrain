import {peabindGen} from "../js/tools/peabind.js"

await peabindGen({
	descriptionFn: "test/mockbinding.json",
	outputFn: "test/mockbinding.cpp"
});
