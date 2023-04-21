# Experimental


## Requirements

- [protoc](https://grpc.io/docs/protoc-installation/)
- [protoc go plugins](https://grpc.io/docs/languages/go/quickstart/#prerequisites)

## Generate go module

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    server.proto
```
