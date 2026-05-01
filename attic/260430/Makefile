.PHONY: test
test:
	node ./js/tools/peabind-cli.js test/mockbinding.json -o test/mockbinding.cpp
	g++ -I ext/quickjs -o bin/testmain test/*.cpp ext/quickjs/libquickjs.a
	./bin/testmain
