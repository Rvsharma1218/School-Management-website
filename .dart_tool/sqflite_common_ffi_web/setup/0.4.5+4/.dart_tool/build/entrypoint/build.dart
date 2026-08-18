// @dart=3.6
// ignore_for_file: type=lint
// build_runner >=2.4.16
import 'dart:io' as _io;
import 'package:build_runner/src/build_plan/builder_factories.dart'
    as _build_runner;
import 'package:build_runner/src/bootstrap/processes.dart' as _build_runner;
import 'package:build_web_compilers/builders.dart' as _i1;

final _builderFactories = _build_runner.BuilderFactories(
  {
    'build_web_compilers:dart2js_modules': [
      _i1.dart2jsMetaModuleBuilder,
      _i1.dart2jsMetaModuleCleanBuilder,
      _i1.dart2jsModuleBuilder
    ],
    'build_web_compilers:dart2wasm_modules': [
      _i1.dart2wasmMetaModuleBuilder,
      _i1.dart2wasmMetaModuleCleanBuilder,
      _i1.dart2wasmModuleBuilder
    ],
    'build_web_compilers:ddc': [_i1.ddcKernelBuilder, _i1.ddcBuilder],
    'build_web_compilers:ddc_modules': [
      _i1.ddcMetaModuleBuilder,
      _i1.ddcMetaModuleCleanBuilder,
      _i1.ddcModuleBuilder
    ],
    'build_web_compilers:entrypoint': [_i1.webEntrypointBuilder],
    'build_web_compilers:entrypoint_marker': [_i1.webEntrypointMarkerBuilder],
    'build_web_compilers:module_library': [_i1.moduleLibraryBuilder],
    'build_web_compilers:sdk_js': [_i1.sdkJsCompile, _i1.sdkJsCopyRequirejs],
  },
  postProcessBuilderFactories: {
    'build_web_compilers:dart2js_archive_extractor':
        _i1.dart2jsArchiveExtractor,
    'build_web_compilers:dart_source_cleanup': _i1.dartSourceCleanup,
    'build_web_compilers:module_cleanup': _i1.moduleCleanup,
  },
);
void main(List<String> args) async {
  _io.exitCode = await _build_runner.ChildProcess.run(
    args,
    _builderFactories,
  )!;
}
