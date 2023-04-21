# Scraper protocol

This repo mainly contians the `server.proto` that defines a scraper.

The server.proto can also be used by by clients such as the F2F app or RT-CV to communicate with a scraper

## Requirements

- [protoc](https://grpc.io/docs/protoc-installation/)
- [protoc go plugins](https://grpc.io/docs/languages/go/quickstart/#prerequisites)

## Generate go module

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    server.proto
```
