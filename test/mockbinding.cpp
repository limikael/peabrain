
            extern "C" {
            #include "quickjs.h"
            }

            #include <string>

            #include "mockapi.h"
            
            static JSValue pea_helloint(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                if (argc!=0)
                    return JS_ThrowTypeError(ctx, "wrong arg count");
        
                
                
        
                    int ret;

                    ret=helloint();
                    return JS_NewUint32(ctx,ret)
;
                }
            

            static JSValue pea_hellovoid(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                if (argc!=0)
                    return JS_ThrowTypeError(ctx, "wrong arg count");
        
                
                
        
                    hellovoid();
                    return JS_UNDEFINED;
                }
            

            static JSValue pea_helloinc(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                if (argc!=1)
                    return JS_ThrowTypeError(ctx, "wrong arg count");
        
                int arg_0;

                
                    JS_ToInt32(ctx,&arg_0,argv[0]);
                
        
                    int ret;

                    ret=helloinc(arg_0);
                    return JS_NewUint32(ctx,ret)
;
                }
            

            static JSValue pea_concat(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                if (argc!=2)
                    return JS_ThrowTypeError(ctx, "wrong arg count");
        
                std::string arg_0;

std::string arg_1;

                
                    const char *arg_0_=JS_ToCString(ctx,argv[0]);
                    arg_0=std::string(arg_0_);
                    JS_FreeCString(ctx,arg_0_);
                

                    const char *arg_1_=JS_ToCString(ctx,argv[1]);
                    arg_1=std::string(arg_1_);
                    JS_FreeCString(ctx,arg_1_);
                
        
                    std::string ret;

                    ret=concat(arg_0,arg_1);
                    return JS_NewString(ctx,ret.c_str());
                }
            

            void pea_init(JSContext *ctx) {
                JSValue global=JS_GetGlobalObject(ctx);
                
            JSValue reg_helloint=JS_NewCFunction(ctx,pea_helloint,"helloint",0);
            JS_SetPropertyStr(ctx,global,"helloint",reg_helloint);
        

            JSValue reg_hellovoid=JS_NewCFunction(ctx,pea_hellovoid,"hellovoid",0);
            JS_SetPropertyStr(ctx,global,"hellovoid",reg_hellovoid);
        

            JSValue reg_helloinc=JS_NewCFunction(ctx,pea_helloinc,"helloinc",0);
            JS_SetPropertyStr(ctx,global,"helloinc",reg_helloinc);
        

            JSValue reg_concat=JS_NewCFunction(ctx,pea_concat,"concat",0);
            JS_SetPropertyStr(ctx,global,"concat",reg_concat);
        
                JS_FreeValue(ctx,global);
            }
        