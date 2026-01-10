#include <cstdio>
#include <cassert>
#include <cstring>

extern "C" {
#include "quickjs.h"
}

void test_quickjs() {
    printf("- Quickjs...\n");

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

	/*if (JS_IsException(result)) {
        JSValue exc = JS_GetException(ctx);
        const char *msg = JS_ToCString(ctx, exc);
        fprintf(stderr, "JS exception: %s\n", msg);
        JS_FreeCString(ctx, msg);
        JS_FreeValue(ctx, exc);
    } 

    else {
        // Print return value 
        const char *res = JS_ToCString(ctx, result);
        if (res) {
            printf("JS returned: %s\n", res);
            JS_FreeCString(ctx, res);
        }
    }*/

    JS_FreeValue(ctx, result);

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}