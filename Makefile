.PHONY: test
test:
	node ./test/genbinding.js
	g++ -I ext/quickjs -o bin/testmain test/*.cpp ext/quickjs/libquickjs.a
	./bin/testmain
