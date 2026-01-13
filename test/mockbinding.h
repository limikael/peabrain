#pragma once
extern "C" {
    #include "quickjs.h"
}
#include "mockapi.h"
void pea_init(JSContext *ctx);
void pea_add_TestClass(JSContext *ctx, const char *name, TestClass* val);
void pea_add_AnotherTest(JSContext *ctx, const char *name, AnotherTest* val);