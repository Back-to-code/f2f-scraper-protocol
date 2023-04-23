///
//  Generated code. Do not modify.
//  source: server.proto
//
// @dart = 2.12
// ignore_for_file: annotate_overrides,camel_case_types,constant_identifier_names,directives_ordering,library_prefixes,non_constant_identifier_names,prefer_final_fields,return_of_invalid_type,unnecessary_const,unnecessary_import,unnecessary_this,unused_import,unused_shown_name

import 'dart:async' as $async;

import 'dart:core' as $core;

import 'package:grpc/service_api.dart' as $grpc;
import 'server.pb.dart' as $0;
export 'server.pb.dart';

class InitClient extends $grpc.Client {
  static final _$setRtCvLocation =
      $grpc.ClientMethod<$0.SetRtCvLocationRequest, $0.Empty>(
          '/scraper.Init/SetRtCvLocation',
          ($0.SetRtCvLocationRequest value) => value.writeToBuffer(),
          ($core.List<$core.int> value) => $0.Empty.fromBuffer(value));

  InitClient($grpc.ClientChannel channel,
      {$grpc.CallOptions? options,
      $core.Iterable<$grpc.ClientInterceptor>? interceptors})
      : super(channel, options: options, interceptors: interceptors);

  $grpc.ResponseFuture<$0.Empty> setRtCvLocation(
      $0.SetRtCvLocationRequest request,
      {$grpc.CallOptions? options}) {
    return $createUnaryCall(_$setRtCvLocation, request, options: options);
  }
}

abstract class InitServiceBase extends $grpc.Service {
  $core.String get $name => 'scraper.Init';

  InitServiceBase() {
    $addMethod($grpc.ServiceMethod<$0.SetRtCvLocationRequest, $0.Empty>(
        'SetRtCvLocation',
        setRtCvLocation_Pre,
        false,
        false,
        ($core.List<$core.int> value) =>
            $0.SetRtCvLocationRequest.fromBuffer(value),
        ($0.Empty value) => value.writeToBuffer()));
  }

  $async.Future<$0.Empty> setRtCvLocation_Pre($grpc.ServiceCall call,
      $async.Future<$0.SetRtCvLocationRequest> request) async {
    return setRtCvLocation(call, await request);
  }

  $async.Future<$0.Empty> setRtCvLocation(
      $grpc.ServiceCall call, $0.SetRtCvLocationRequest request);
}

class ScraperClient extends $grpc.Client {
  static final _$checkCredentials = $grpc.ClientMethod<
          $0.CheckCredentialsRequest, $0.CheckCredentialsResponse>(
      '/scraper.Scraper/CheckCredentials',
      ($0.CheckCredentialsRequest value) => value.writeToBuffer(),
      ($core.List<$core.int> value) =>
          $0.CheckCredentialsResponse.fromBuffer(value));

  ScraperClient($grpc.ClientChannel channel,
      {$grpc.CallOptions? options,
      $core.Iterable<$grpc.ClientInterceptor>? interceptors})
      : super(channel, options: options, interceptors: interceptors);

  $grpc.ResponseFuture<$0.CheckCredentialsResponse> checkCredentials(
      $0.CheckCredentialsRequest request,
      {$grpc.CallOptions? options}) {
    return $createUnaryCall(_$checkCredentials, request, options: options);
  }
}

abstract class ScraperServiceBase extends $grpc.Service {
  $core.String get $name => 'scraper.Scraper';

  ScraperServiceBase() {
    $addMethod($grpc.ServiceMethod<$0.CheckCredentialsRequest,
            $0.CheckCredentialsResponse>(
        'CheckCredentials',
        checkCredentials_Pre,
        false,
        false,
        ($core.List<$core.int> value) =>
            $0.CheckCredentialsRequest.fromBuffer(value),
        ($0.CheckCredentialsResponse value) => value.writeToBuffer()));
  }

  $async.Future<$0.CheckCredentialsResponse> checkCredentials_Pre(
      $grpc.ServiceCall call,
      $async.Future<$0.CheckCredentialsRequest> request) async {
    return checkCredentials(call, await request);
  }

  $async.Future<$0.CheckCredentialsResponse> checkCredentials(
      $grpc.ServiceCall call, $0.CheckCredentialsRequest request);
}
