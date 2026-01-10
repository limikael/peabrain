
            extern "C" {
            #include "quickjs.h"
            }
        
                #include "mockapi.h"
            
            static JSValue pea_helloint(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
        
                    int ret=helloint();
                    return JS_NewUint32(ctx, ret);
                }
            
            static JSValue pea_hellovoid(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
        
                    hellovoid();
                    return JS_UNDEFINED;
                }
            
            static JSValue pea_helloinc(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
        
                    int arg_0;
                    JS_ToInt32(ctx,&arg_0,argv[0]);

                
                    int ret=helloinc(arg_0);
                    return JS_NewUint32(ctx, ret);
                }
            
            void pea_init(JSContext *ctx) {
                JSValue global=JS_GetGlobalObject(ctx);
        
            JSValue reg_helloint=JS_NewCFunction(ctx,pea_helloint,"helloint",0);
            JS_SetPropertyStr(ctx,global,"helloint",reg_helloint);
        
            JSValue reg_hellovoid=JS_NewCFunction(ctx,pea_hellovoid,"hellovoid",0);
            JS_SetPropertyStr(ctx,global,"hellovoid",reg_hellovoid);
        
            JSValue reg_helloinc=JS_NewCFunction(ctx,pea_helloinc,"helloinc",0);
            JS_SetPropertyStr(ctx,global,"helloinc",reg_helloinc);
        
                JS_FreeValue(ctx,global);
            }
        