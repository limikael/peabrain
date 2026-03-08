#include "FsPlugin.h"
#include <stdlib.h>
#include <WiFi.h>
#include "base64.h"

FsPlugin::FsPlugin() {
}

void FsPlugin::setJsEngine(JsEngine& jsEngine_) {
	jsEngine=&jsEngine_;
}

void FsPlugin::init() {
    jsEngine->addGlobal("fileOpen",jsEngine->newMethod(this,&FsPlugin::fileOpen,2));
    jsEngine->addGlobal("fileClose",jsEngine->newMethod(this,&FsPlugin::fileClose,1));
    jsEngine->addGlobal("fileRead",jsEngine->newMethod(this,&FsPlugin::fileRead,1));
    jsEngine->addGlobal("fileReadDirEnt",jsEngine->newMethod(this,&FsPlugin::fileReadDirEnt,1));
    jsEngine->addGlobal("fileWrite",jsEngine->newMethod(this,&FsPlugin::fileWrite,1));
    jsEngine->addGlobal("fileWriteBase64",jsEngine->newMethod(this,&FsPlugin::fileWriteBase64,1));
    jsEngine->addGlobal("fileExists",jsEngine->newMethod(this,&FsPlugin::fileExists,1));
    jsEngine->addGlobal("fileUnlink",jsEngine->newMethod(this,&FsPlugin::fileUnlink,1));
}

void FsPlugin::loop() {
}

void FsPlugin::close() {
    for (JsFile& f: files)
        f.file.close();

    files.clear();
}

JSValue FsPlugin::fileReadDirEnt(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(jsEngine->getContext(),&fid,argv[0]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid file id");

    File file=it->file.openNextFile();
    if (!file)
        return JS_UNDEFINED;

    return JS_NewString(jsEngine->getContext(),file.name());
}

JSValue FsPlugin::fileOpen(int argc, JSValueConst *argv) {
    JsCString path(jsEngine->getContext(),argv[0]);
    JsCString mode(jsEngine->getContext(),argv[1]);

    File f=SPIFFS.open(path.c_str(), mode.c_str());
    if (!f)
        return JS_ThrowInternalError(jsEngine->getContext(),"failed to open file");

    JsFile jsf;
    jsf.id=jsEngine->getNewResourceId();
    jsf.file=f;
    files.push_back(jsf);

    return JS_NewUint32(jsEngine->getContext(),jsf.id);
}

JSValue FsPlugin::fileRead(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(jsEngine->getContext(),&fid,argv[0]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid file id");

    const size_t N=128;
    char buffer[N];
    size_t bytesRead=it->file.readBytes(buffer, N);

    return JS_NewStringLen(jsEngine->getContext(),buffer,bytesRead);
}

JSValue FsPlugin::fileWrite(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(jsEngine->getContext(),&fid,argv[0]);
    JsCString data(jsEngine->getContext(),argv[1]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid file id");

    //it->file.print("helloooo");
    //it->file.write((uint8_t *)data.c_str(),strlen(data.c_str()));
    it->file.print(data.c_str());
    return JS_UNDEFINED;
}

JSValue FsPlugin::fileWriteBase64(int argc, JSValueConst *argv) {
    if (argc!=2)
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid arg count");

    uint32_t fid;
    JS_ToUint32(jsEngine->getContext(),&fid,argv[0]);
    JsCString data(jsEngine->getContext(),argv[1]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid file id");

    size_t data_len=strlen(data.c_str());
    uint8_t decoded[base64_get_max_decoded_size(data_len)];
    size_t decoded_len=base64_decode(data.c_str(),data_len,decoded);

    it->file.write(decoded,decoded_len);
    return JS_UNDEFINED;
}

JSValue FsPlugin::fileClose(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(jsEngine->getContext(),&fid,argv[0]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(jsEngine->getContext(),"invalid file id");

    it->file.close();
    files.erase(it);
    return JS_UNDEFINED;
}

JSValue FsPlugin::fileExists(int argc, JSValueConst *argv) {
    JsCString path(jsEngine->getContext(),argv[0]);
    return JS_NewBool(jsEngine->getContext(),SPIFFS.exists(path.c_str()));
}

JSValue FsPlugin::fileUnlink(int argc, JSValueConst *argv) {
    if (argc!=1)
        return JS_ThrowInternalError(jsEngine->getContext(),"wrong arg count");

    JsCString path(jsEngine->getContext(),argv[0]);
    if (!SPIFFS.remove(path.c_str()))
        return JS_ThrowInternalError(jsEngine->getContext(),"unable to remove file");

    return JS_UNDEFINED;
}
