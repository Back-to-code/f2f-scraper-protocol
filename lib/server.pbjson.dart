///
//  Generated code. Do not modify.
//  source: server.proto
//
// @dart = 2.12
// ignore_for_file: annotate_overrides,camel_case_types,constant_identifier_names,deprecated_member_use_from_same_package,directives_ordering,library_prefixes,non_constant_identifier_names,prefer_final_fields,return_of_invalid_type,unnecessary_const,unnecessary_import,unnecessary_this,unused_import,unused_shown_name

import 'dart:core' as $core;
import 'dart:convert' as $convert;
import 'dart:typed_data' as $typed_data;
@$core.Deprecated('Use emptyDescriptor instead')
const Empty$json = const {
  '1': 'Empty',
};

/// Descriptor for `Empty`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List emptyDescriptor = $convert.base64Decode('CgVFbXB0eQ==');
@$core.Deprecated('Use setRtCvLocationRequestDescriptor instead')
const SetRtCvLocationRequest$json = const {
  '1': 'SetRtCvLocationRequest',
  '2': const [
    const {'1': 'basicAuthUsername', '3': 1, '4': 1, '5': 9, '10': 'basicAuthUsername'},
    const {'1': 'basicAuthPassword', '3': 2, '4': 1, '5': 9, '10': 'basicAuthPassword'},
    const {'1': 'serverLocation', '3': 3, '4': 1, '5': 9, '10': 'serverLocation'},
  ],
};

/// Descriptor for `SetRtCvLocationRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List setRtCvLocationRequestDescriptor = $convert.base64Decode('ChZTZXRSdEN2TG9jYXRpb25SZXF1ZXN0EiwKEWJhc2ljQXV0aFVzZXJuYW1lGAEgASgJUhFiYXNpY0F1dGhVc2VybmFtZRIsChFiYXNpY0F1dGhQYXNzd29yZBgCIAEoCVIRYmFzaWNBdXRoUGFzc3dvcmQSJgoOc2VydmVyTG9jYXRpb24YAyABKAlSDnNlcnZlckxvY2F0aW9u');
@$core.Deprecated('Use checkCredentialsRequestDescriptor instead')
const CheckCredentialsRequest$json = const {
  '1': 'CheckCredentialsRequest',
  '2': const [
    const {'1': 'username', '3': 1, '4': 1, '5': 9, '10': 'username'},
    const {'1': 'password', '3': 2, '4': 1, '5': 9, '10': 'password'},
  ],
};

/// Descriptor for `CheckCredentialsRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List checkCredentialsRequestDescriptor = $convert.base64Decode('ChdDaGVja0NyZWRlbnRpYWxzUmVxdWVzdBIaCgh1c2VybmFtZRgBIAEoCVIIdXNlcm5hbWUSGgoIcGFzc3dvcmQYAiABKAlSCHBhc3N3b3Jk');
@$core.Deprecated('Use checkCredentialsResponseDescriptor instead')
const CheckCredentialsResponse$json = const {
  '1': 'CheckCredentialsResponse',
  '2': const [
    const {'1': 'success', '3': 1, '4': 1, '5': 8, '10': 'success'},
  ],
};

/// Descriptor for `CheckCredentialsResponse`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List checkCredentialsResponseDescriptor = $convert.base64Decode('ChhDaGVja0NyZWRlbnRpYWxzUmVzcG9uc2USGAoHc3VjY2VzcxgBIAEoCFIHc3VjY2Vzcw==');
