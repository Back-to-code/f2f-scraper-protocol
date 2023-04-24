# Scraper protocol

This repo mainly contians the `server.proto` that defines a scraper and **some** pre generated code.

The `server.proto` can also be used by by clients such as the F2F app or RT-CV to communicate with a scraper

## Requirements

- [protoc](https://grpc.io/docs/protoc-installation/)

## Generate go module

- [protoc go plugins](https://grpc.io/docs/languages/go/quickstart/#prerequisites)

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    server.proto
```

## Generate dart module

- [protoc dart plugin](https://grpc.io/docs/languages/dart/quickstart/#prerequisites)

```bash
protoc --dart_out=grpc:lib server.proto
```
