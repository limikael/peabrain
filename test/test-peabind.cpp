#include <cstdio>
#include <cassert>
#include <string>

extern "C" {
#include "quickjs.h"
}

std::string runcode(JSContext *ctx, const char *code) {
    JSValue result=JS_Eval(ctx,
        code,
        strlen(code),
        "<input>",
        JS_EVAL_TYPE_GLOBAL
    );

    if (JS_IsException(result)) {
        JSValue ex=JS_GetException(ctx);
        const char *msg = JS_ToCString(ctx, ex);
        printf("exception: %s\n",msg);
        JS_FreeCString(ctx, msg);
        JS_FreeValue(ctx, ex);
    }

    assert(!JS_IsException(result));

    const char *res = JS_ToCString(ctx, result);
    std::string resString=std::string(res);
    JS_FreeCString(ctx,res);
    JS_FreeValue(ctx,result);

    return resString;
}

void pea_init(JSContext *ctx);

void test_peabind() {
	printf("- Peabind basic...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);
    std::string res=runcode(ctx,"\
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
    ");

    assert(res=="123,2,xxyy,wrong arg count");

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}

void test_peabind_classes() {
    printf("- Peabind basic classes...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);
    std::string res=runcode(ctx,"\
        let t=new TestClass(5); \
        let v=t.getVal(); \
        t.setVal(123); \
        let u=t.getVal(); \
        ['a',v,u]; \
    ");

    assert(res=="a,5,123");

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}

void test_peabind_references() {
    printf("- Peabind return types classes...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);
    std::string res=runcode(ctx,"\
        let t=createTestClass(5); \
        let v=t.getVal(); \
        let u=getTestClassValue(t); \
        [v,u]; \
    ");

    assert(res=="5,5");

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}

void test_peabind_borrowed_references() {
    printf("- Peabind can use borrowed refs...\n");

    JSRuntime *rt = JS_NewRuntime();
    JSContext *ctx = JS_NewContext(rt);

    pea_init(ctx);
    std::string res=runcode(ctx,"\
        let t=new AnotherTest(); \
        let v=t.getTestClass().getVal(); \
        [v]; \
    ");

    assert(res=="789");

    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
}
