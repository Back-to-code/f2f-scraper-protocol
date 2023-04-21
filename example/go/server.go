package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"

	pb "bitbucket.org/teamscript/scraper-protocol"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type initServer struct {
	pb.UnimplementedInitServer
}

func (initServer) SetRtCvLocation(_ context.Context, req *pb.SetRtCvLocationRequest) (*pb.Empty, error) {
	data, _ := json.Marshal(req)
	fmt.Println("set server location:", string(data))

	return nil, status.Errorf(codes.Unimplemented, "method SetRtCvLocation not implemented")
}

type scraperServer struct {
	pb.UnimplementedScraperServer
}

func (scraperServer) CheckCredentials(_ context.Context, req *pb.CheckCredentialsRequest) (*pb.CheckCredentialsResponse, error) {
	data, _ := json.Marshal(req)
	fmt.Println("check credentials:", string(data))

	return nil, status.Errorf(codes.Unimplemented, "method CheckCredentials not implemented")
}

func main() {
	lis, err := net.Listen("tcp", "127.0.0.1:50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()

	pb.RegisterInitServer(s, &initServer{})
	pb.RegisterScraperServer(s, &scraperServer{})

	log.Printf("server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
