import 'package:grpc/grpc.dart';
import 'package:scraperProtocol/server.pbgrpc.dart';

class InitService extends InitServiceBase {
  @override
  Future<Empty> setRtCvLocation(
      ServiceCall call, SetRtCvLocationRequest request) async {
    return Empty();
  }
}

class ScraperService extends ScraperServiceBase {
  @override
  Future<CheckCredentialsResponse> checkCredentials(
      ServiceCall call, CheckCredentialsRequest request) async {
    return CheckCredentialsResponse();
  }
}

Future<void> main(List<String> args) async {
  final server = Server(
    [
      InitService(),
      ScraperService(),
    ],
    [],
    CodecRegistry(codecs: const [GzipCodec(), IdentityCodec()]),
  );
  await server.serve(port: 50051);
  print('Server listening on port ${server.port}...');
}
