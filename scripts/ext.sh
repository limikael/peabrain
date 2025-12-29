rm -rf lib/quickjs_min
mkdir -p lib/quickjs_min

cp \
	ext/quickjs/cutils.c\
	ext/quickjs/cutils.h\
	ext/quickjs/dtoa.c\
	ext/quickjs/dtoa.h\
	ext/quickjs/libregexp.c\
	ext/quickjs/libregexp.h\
	ext/quickjs/libregexp-opcode.h\
	ext/quickjs/libunicode.c\
	ext/quickjs/libunicode.h\
	ext/quickjs/libunicode-table.h\
	ext/quickjs/list.h\
	ext/quickjs/quickjs-atom.h\
	ext/quickjs/quickjs.c\
	ext/quickjs/quickjs.h\
	ext/quickjs/quickjs-opcode.h\
	ext/quickjs/unicode_gen.c\
	ext/quickjs/unicode_gen_def.h\
	lib/quickjs_min

#ext/quickjs/qjs.c\
#ext/quickjs/qjsc.c\
#ext/quickjs/quickjs-libc.c\
#ext/quickjs/quickjs-libc.h\
#ext/quickjs/run-test262.c\
