///
//  Generated code. Do not modify.
//  source: server.proto
//
// @dart = 2.12
// ignore_for_file: annotate_overrides,camel_case_types,constant_identifier_names,directives_ordering,library_prefixes,non_constant_identifier_names,prefer_final_fields,return_of_invalid_type,unnecessary_const,unnecessary_import,unnecessary_this,unused_import,unused_shown_name

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class Empty extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'Empty', package: const $pb.PackageName(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'scraper'), createEmptyInstance: create)
    ..hasRequiredFields = false
  ;

  Empty._() : super();
  factory Empty() => create();
  factory Empty.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory Empty.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
  'Will be removed in next major version')
  Empty clone() => Empty()..mergeFromMessage(this);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
  'Will be removed in next major version')
  Empty copyWith(void Function(Empty) updates) => super.copyWith((message) => updates(message as Empty)) as Empty; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static Empty create() => Empty._();
  Empty createEmptyInstance() => create();
  static $pb.PbList<Empty> createRepeated() => $pb.PbList<Empty>();
  @$core.pragma('dart2js:noInline')
  static Empty getDefault() => _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Empty>(create);
  static Empty? _defaultInstance;
}

class SetRtCvLocationRequest extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'SetRtCvLocationRequest', package: const $pb.PackageName(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'scraper'), createEmptyInstance: create)
    ..aOS(1, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'basicAuthUsername', protoName: 'basicAuthUsername')
    ..aOS(2, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'basicAuthPassword', protoName: 'basicAuthPassword')
    ..aOS(3, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'serverLocation', protoName: 'serverLocation')
    ..hasRequiredFields = false
  ;

  SetRtCvLocationRequest._() : super();
  factory SetRtCvLocationRequest({
    $core.String? basicAuthUsername,
    $core.String? basicAuthPassword,
    $core.String? serverLocation,
  }) {
    final _result = create();
    if (basicAuthUsername != null) {
      _result.basicAuthUsername = basicAuthUsername;
    }
    if (basicAuthPassword != null) {
      _result.basicAuthPassword = basicAuthPassword;
    }
    if (serverLocation != null) {
      _result.serverLocation = serverLocation;
    }
    return _result;
  }
  factory SetRtCvLocationRequest.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory SetRtCvLocationRequest.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
  'Will be removed in next major version')
  SetRtCvLocationRequest clone() => SetRtCvLocationRequest()..mergeFromMessage(this);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
  'Will be removed in next major version')
  SetRtCvLocationRequest copyWith(void Function(SetRtCvLocationRequest) updates) => super.copyWith((message) => updates(message as SetRtCvLocationRequest)) as SetRtCvLocationRequest; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static SetRtCvLocationRequest create() => SetRtCvLocationRequest._();
  SetRtCvLocationRequest createEmptyInstance() => create();
  static $pb.PbList<SetRtCvLocationRequest> createRepeated() => $pb.PbList<SetRtCvLocationRequest>();
  @$core.pragma('dart2js:noInline')
  static SetRtCvLocationRequest getDefault() => _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SetRtCvLocationRequest>(create);
  static SetRtCvLocationRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get basicAuthUsername => $_getSZ(0);
  @$pb.TagNumber(1)
  set basicAuthUsername($core.String v) { $_setString(0, v); }
  @$pb.TagNumber(1)
  $core.bool hasBasicAuthUsername() => $_has(0);
  @$pb.TagNumber(1)
  void clearBasicAuthUsername() => clearField(1);

  @$pb.TagNumber(2)
  $core.String get basicAuthPassword => $_getSZ(1);
  @$pb.TagNumber(2)
  set basicAuthPassword($core.String v) { $_setString(1, v); }
  @$pb.TagNumber(2)
  $core.bool hasBasicAuthPassword() => $_has(1);
  @$pb.TagNumber(2)
  void clearBasicAuthPassword() => clearField(2);

  @$pb.TagNumber(3)
  $core.String get serverLocation => $_getSZ(2);
  @$pb.TagNumber(3)
  set serverLocation($core.String v) { $_setString(2, v); }
  @$pb.TagNumber(3)
  $core.bool hasServerLocation() => $_has(2);
  @$pb.TagNumber(3)
  void clearServerLocation() => clearField(3);
}

class CheckCredentialsRequest extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'CheckCredentialsRequest', package: const $pb.PackageName(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'scraper'), createEmptyInstance: create)
    ..aOS(1, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'username')
    ..aOS(2, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'password')
    ..hasRequiredFields = false
  ;

  CheckCredentialsRequest._() : super();
  factory CheckCredentialsRequest({
    $core.String? username,
    $core.String? password,
  }) {
    final _result = create();
    if (username != null) {
      _result.username = username;
    }
    if (password != null) {
      _result.password = password;
    }
    return _result;
  }
  factory CheckCredentialsRequest.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory CheckCredentialsRequest.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
  'Will be removed in next major version')
  CheckCredentialsRequest clone() => CheckCredentialsRequest()..mergeFromMessage(this);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
  'Will be removed in next major version')
  CheckCredentialsRequest copyWith(void Function(CheckCredentialsRequest) updates) => super.copyWith((message) => updates(message as CheckCredentialsRequest)) as CheckCredentialsRequest; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static CheckCredentialsRequest create() => CheckCredentialsRequest._();
  CheckCredentialsRequest createEmptyInstance() => create();
  static $pb.PbList<CheckCredentialsRequest> createRepeated() => $pb.PbList<CheckCredentialsRequest>();
  @$core.pragma('dart2js:noInline')
  static CheckCredentialsRequest getDefault() => _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<CheckCredentialsRequest>(create);
  static CheckCredentialsRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get username => $_getSZ(0);
  @$pb.TagNumber(1)
  set username($core.String v) { $_setString(0, v); }
  @$pb.TagNumber(1)
  $core.bool hasUsername() => $_has(0);
  @$pb.TagNumber(1)
  void clearUsername() => clearField(1);

  @$pb.TagNumber(2)
  $core.String get password => $_getSZ(1);
  @$pb.TagNumber(2)
  set password($core.String v) { $_setString(1, v); }
  @$pb.TagNumber(2)
  $core.bool hasPassword() => $_has(1);
  @$pb.TagNumber(2)
  void clearPassword() => clearField(2);
}

class CheckCredentialsResponse extends $pb.GeneratedMessage {
  static final $pb.BuilderInfo _i = $pb.BuilderInfo(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'CheckCredentialsResponse', package: const $pb.PackageName(const $core.bool.fromEnvironment('protobuf.omit_message_names') ? '' : 'scraper'), createEmptyInstance: create)
    ..aOB(1, const $core.bool.fromEnvironment('protobuf.omit_field_names') ? '' : 'success')
    ..hasRequiredFields = false
  ;

  CheckCredentialsResponse._() : super();
  factory CheckCredentialsResponse({
    $core.bool? success,
  }) {
    final _result = create();
    if (success != null) {
      _result.success = success;
    }
    return _result;
  }
  factory CheckCredentialsResponse.fromBuffer($core.List<$core.int> i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromBuffer(i, r);
  factory CheckCredentialsResponse.fromJson($core.String i, [$pb.ExtensionRegistry r = $pb.ExtensionRegistry.EMPTY]) => create()..mergeFromJson(i, r);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.deepCopy] instead. '
  'Will be removed in next major version')
  CheckCredentialsResponse clone() => CheckCredentialsResponse()..mergeFromMessage(this);
  @$core.Deprecated(
  'Using this can add significant overhead to your binary. '
  'Use [GeneratedMessageGenericExtensions.rebuild] instead. '
  'Will be removed in next major version')
  CheckCredentialsResponse copyWith(void Function(CheckCredentialsResponse) updates) => super.copyWith((message) => updates(message as CheckCredentialsResponse)) as CheckCredentialsResponse; // ignore: deprecated_member_use
  $pb.BuilderInfo get info_ => _i;
  @$core.pragma('dart2js:noInline')
  static CheckCredentialsResponse create() => CheckCredentialsResponse._();
  CheckCredentialsResponse createEmptyInstance() => create();
  static $pb.PbList<CheckCredentialsResponse> createRepeated() => $pb.PbList<CheckCredentialsResponse>();
  @$core.pragma('dart2js:noInline')
  static CheckCredentialsResponse getDefault() => _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<CheckCredentialsResponse>(create);
  static CheckCredentialsResponse? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get success => $_getBF(0);
  @$pb.TagNumber(1)
  set success($core.bool v) { $_setBool(0, v); }
  @$pb.TagNumber(1)
  $core.bool hasSuccess() => $_has(0);
  @$pb.TagNumber(1)
  void clearSuccess() => clearField(1);
}

