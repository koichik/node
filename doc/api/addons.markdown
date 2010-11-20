## Addons

<!--
Addons are dynamically linked shared objects. They can provide glue to C and
C++ libraries. The API (at the moment) is rather complex, involving
knowledge of several libraries:
-->
�A�h�I���͓��I�ɋ��L�I�u�W�F�N�g�������N���܂��B
�����́AC �� C++ �̃��C�u�����ɐڍ��_��񋟂��܂��B
API �͂������̃��C�u�����̒m�����K�v�ŁA(�����_�ł�) ���Ȃ蕡�G�ł��B

<!--
 - V8 JavaScript, a C++ library. Used for interfacing with JavaScript:
   creating objects, calling functions, etc.  Documented mostly in the
   `v8.h` header file (`deps/v8/include/v8.h` in the Node source tree).
-->
 - V8 JavaScript �� C++ �̃��C�u�����ł��B
   JavaScript �̃I�u�W�F�N�g�쐬��֐��Ăяo�����̃C���^�t�F�[�X�Ɏg�p����܂��B
   �h�L�������g�͎�ɁA`v8.h` �̃w�b�_�t�@�C��
   (Node �̃\�[�X�c���[�̒��� `deps/v8/include/v8.h`) �ɋL����Ă��܂��B

<!--
 - libev, C event loop library. Anytime one needs to wait for a file
   descriptor to become readable, wait for a timer, or wait for a signal to
   received one will need to interface with libev.  That is, if you perform
   any I/O, libev will need to be used.  Node uses the `EV_DEFAULT` event
   loop.  Documentation can be found http:/cvs.schmorp.de/libev/ev.html[here].
-->
 - libev �� C �� event loop ���C�u�����ł��B
   �t�@�C���L�q�q���ǂݎ��\�ɂȂ�̂�҂Ƃ��A�^�C�}�[��҂Ƃ��A�V�O�i������M����̂�҂Ƃ��͂��ł��A
   libv �̃C���^�t�F�[�X���K�v�ɂȂ�܂��B
   �܂�A���炩�� I/O ����������ƕK�� libev ���g���K�v������Ƃ������Ƃł��B
   Node �� `EV_DEFAULT` �Ƃ����C�x���g���[�v���g���܂��B
   �h�L�������g�́A[������](http:/cvs.schmorp.de/libev/ev.html) �ɂ���܂��B

<!--
 - libeio, C thread pool library. Used to execute blocking POSIX system
   calls asynchronously. Mostly wrappers already exist for such calls, in
   `src/file.cc` so you will probably not need to use it. If you do need it,
   look at the header file `deps/libeio/eio.h`.
-->
 - libeio �� C �̃X���b�h�v�[�����C�u�����ł��B
   �u���b�N���� POSIX �V�X�e���R�[����񓯊��Ɏ��s���邽�߂Ɏg�p����܂��B
   �����������Ăяo���̂��߂̑��̃��b�p�[�́A���� `src/file.cc` �ɗp�ӂ���Ă���̂ŁA
   �����炭������g���K�v�͂Ȃ����傤�B
   �K�v�ɂȂ�����A`deps/libeio/eio.h` �̃w�b�_�t�@�C�����Q�Ƃ��ĉ������B

<!--
 - Internal Node libraries. Most importantly is the `node::ObjectWrap`
   class which you will likely want to derive from.
-->
 - Node �̓������C�u�����B
   �����Ƃ��d�v�Ȃ̂� `node::ObjectWrap` �N���X�ŁA
   ���̃N���X����h�������邱�Ƃ������Ȃ�ł��傤�B

<!--
 - Others. Look in `deps/` for what else is available.
-->
 - ���̑��B�ǂ̂悤�ȕ������p�ł��邩�� `deps/` �ȉ����Q�Ƃ��Ă����B

<!--
Node statically compiles all its dependencies into the executable. When
compiling your module, you don't need to worry about linking to any of these
libraries.
-->
Node �͑S�Ă̈ˑ����C�u���������s�t�@�C���ɐÓI�ɃR���p�C�����܂��B
���W���[���̃R���p�C�����ɂ́A�����̃����N�ɂ��Ĉ�؋C�ɂ���K�v�͗L��܂���B

<!--
To get started let's make a small Addon which does the following except in
C++:
-->
�ł́A C++ �ňȉ��̗l�ɓ��삷�鏬���ȃA�h�I�����쐬���Ă݂܂��傤�B

    exports.hello = 'world';

<!--
To get started we create a file `hello.cc`:
-->
�܂� `hello.cc` �Ƃ����t�@�C�����쐬���܂�:


    #include <v8.h>

    using namespace v8;

    extern "C" void
    init (Handle<Object> target) 
    {
      HandleScope scope;
      target->Set(String::New("hello"), String::New("World"));
    }

<!--
This source code needs to be built into `hello.node`, the binary Addon. To
do this we create a file called `wscript` which is python code and looks
like this:
-->
���̃\�[�X�R�[�h�́A`hello.node` �Ƃ����o�C�i���A�h�I���Ƃ��ăr���h�����K�v���L��܂��B
���̂��߂� `wscript` �ƌĂ΂��ȉ��̂悤�ȃR�[�h�� Python �ŏ����܂���:

    srcdir = '.'
    blddir = 'build'
    VERSION = '0.0.1'

    def set_options(opt):
      opt.tool_options('compiler_cxx')

    def configure(conf):
      conf.check_tool('compiler_cxx')
      conf.check_tool('node_addon')

    def build(bld):
      obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
      obj.target = 'hello'
      obj.source = 'hello.cc'

<!--
Running `node-waf configure build` will create a file
`build/default/hello.node` which is our Addon.
-->
`node-waf configure build` �����s����ƁA`build/default/hello.node` ���쐬����܂��B���ꂪ�쐬�����A�h�I���ł��B

<!--
`node-waf` is just http://code.google.com/p/waf/[WAF], the python-based build system. `node-waf` is
provided for the ease of users.
-->
`node-waf` �� [WAF](http://code.google.com/p/waf/) �ɂ��� Python �x�[�X�̃r���h�V�X�e���ł��B
`node-waf` �́A���[�U�̕��S�����炷���߂ɒ񋟂���Ă��܂��B

<!--
All Node addons must export a function called `init` with this signature:
-->
�S�Ă� Node �A�h�I���͎��̃V�O�l�`�������� `init` �Ƃ����֐����G�N�X�|�[�g����K�v���L��܂�:

    extern 'C' void init (Handle<Object> target)

<!--
For the moment, that is all the documentation on addons. Please see
<http://github.com/ry/node_postgres> for a real example.
-->
�����_�ł́A�A�h�I���̃h�L�������g�͂���őS�Ăł��B
���ۂ̗�́A<http://github.com/ry/node_postgres> ���Q�Ƃ��Ă��������B
