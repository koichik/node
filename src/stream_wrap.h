#ifndef STREAM_WRAP_H_
#define STREAM_WRAP_H_

#include <v8.h>
#include <node.h>
#include <handle_wrap.h>

namespace node {

class StreamWrap : public HandleWrap {
 public:
  uv_stream_t* GetStream() { return stream_; }

  static void Initialize(v8::Handle<v8::Object> target);

  // JavaScript functions
  static v8::Handle<v8::Value> Write(const v8::Arguments& args);
  static v8::Handle<v8::Value> ReadStart(const v8::Arguments& args);
  static v8::Handle<v8::Value> ReadStop(const v8::Arguments& args);
  static v8::Handle<v8::Value> Shutdown(const v8::Arguments& args);

 protected:
  StreamWrap(v8::Handle<v8::Object> object, uv_stream_t* stream);
  virtual ~StreamWrap() { }
  virtual void SetHandle(uv_handle_t* h);
  void StateChange() { }
  void UpdateWriteQueueSize();

 private:
  static inline char* NewSlab(v8::Handle<v8::Object> global, v8::Handle<v8::Object> wrap_obj);

  // Callbacks for libuv
  static void AfterWrite(uv_write_t* req, int status);
  static uv_buf_t OnAlloc(uv_handle_t* handle, size_t suggested_size);
  static void AfterShutdown(uv_shutdown_t* req, int status);

  static void OnRead(uv_stream_t* handle, ssize_t nread, uv_buf_t buf);
  static void OnRead2(uv_pipe_t* handle, ssize_t nread, uv_buf_t buf,
      uv_handle_type pending);
  static void OnReadCommon(uv_stream_t* handle, ssize_t nread,
      uv_buf_t buf, uv_handle_type pending);

  size_t slab_offset_;
  uv_stream_t* stream_;
};


}  // namespace node


#endif  // STREAM_WRAP_H_
