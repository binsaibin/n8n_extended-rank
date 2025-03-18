#include <napi.h>
#include "kiwi/Kiwi.h"

class KiwiWrapper : public Napi::ObjectWrap<KiwiWrapper> {
private:
    kiwi::Kiwi kiwi;

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "KiwiBuilder", {
            InstanceMethod("analyzeText", &KiwiWrapper::AnalyzeText)
        });
        
        exports.Set("KiwiBuilder", func);
        return exports;
    }

    KiwiWrapper(const Napi::CallbackInfo& info) : 
        Napi::ObjectWrap<KiwiWrapper>(info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "String expected for model path").ThrowAsJavaScriptException();
            return;
        }

        std::string modelPath = info[0].As<Napi::String>().Utf8Value();
        kiwi::KiwiBuilder builder(modelPath, 0, kiwi::BuildOption::default_);
        kiwi = builder.build();
    }

    Napi::Value AnalyzeText(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string text = info[0].As<Napi::String>().Utf8Value();
        auto results = kiwi.analyze(text, 1, kiwi::Match::all, nullptr, {});

        if (!results.empty()) {
            std::string result_str;
            for (const auto& token : results[0].first) {
                std::string token_utf8 = kiwi::utf16To8(token.str);
                result_str += token_utf8 + " ";
            }
            return Napi::String::New(env, result_str);
        }

        return env.Null();
    }
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return KiwiWrapper::Init(env, exports);
}

NODE_API_MODULE(kiwi_addon, Init)
