#include <cstdio>
#include <cassert>

extern "C" {
#include "quickjs.h"
}

void pea_init(JSContext *ctx);

void test_peabind() {
	printf("- Peabind basic...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);

    const char *code="\
        let a=helloint(); \
        let b=helloinc(1); \
        hellovoid(); \
        let s=concat('xx','yy'); \
        let caught='none'; \
        try { \
            let s2=concat('xx'); \
        } \
        catch (e) { \
            caught=e.message; \
        } \
        [a,b,s,caught]; \
    ";

    JSValue result=JS_Eval(ctx,
    	code,
        strlen(code),
        "<input>",
        JS_EVAL_TYPE_GLOBAL
    );

    assert(!JS_IsException(result));

    const char *res = JS_ToCString(ctx, result);
    //printf("out: %s\n",res);
    assert(!strcmp("123,2,xxyy,wrong arg count",res));

    JS_FreeValue(ctx,result);
    JS_FreeContext(ctx);
    //JS_RunGC(rt);
    JS_FreeRuntime(rt);
}

void test_peabind_classes() {
    printf("- Peabind basic classes...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);

    const char *code="\
        let t=new TestClass(); \
        ['a']; \
    ";

    JSValue result=JS_Eval(ctx,
        code,
        strlen(code),
        "<input>",
        JS_EVAL_TYPE_GLOBAL
    );

    assert(!JS_IsException(result));

    const char *res = JS_ToCString(ctx, result);
    printf("out: %s\n",res);
    assert(!strcmp("a",res));

    JS_FreeValue(ctx,result);
    JS_FreeContext(ctx);
    //JS_RunGC(rt);
    JS_FreeRuntime(rt);
}
