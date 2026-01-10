#include <cstdio>
#include <cassert>

extern "C" {
#include "quickjs.h"
}

void test_canopener() {
	printf("- Canopener bindings (WIP)...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    const char *code="1+1";

    JSValue result=JS_Eval(ctx,
    	code,
        strlen(code),
        "<input>",
        JS_EVAL_TYPE_GLOBAL
    );

    const char *res = JS_ToCString(ctx, result);
    assert(!strcmp("2",res));

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}
