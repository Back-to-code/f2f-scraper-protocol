package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	pb "bitbucket.org/teamscript/scraper-protocol"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	basicUsername := "tester"
	basicPassword := randomString(32)
	expectedAuth := fmt.Sprintf("Basic %s:%s", basicUsername, basicPassword)

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Post("/api/v1/scraper/scanCV", func(c *fiber.Ctx) error {
		if c.GetReqHeaders()["Authorization"] != expectedAuth {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "auth header is invalid",
			})
		}

		fmt.Println("---------------------")
		fmt.Println("Recived CV")
		fmt.Println(string(c.Body()))
		return c.JSON(fiber.Map{
			"hasMatches": false,
			"success":    true,
		})
	})

	port := "3000"
	go pull(LoginCredentials{
		Username:       basicUsername,
		Password:       basicPassword,
		ServerLocation: "http://localhost:" + port,
	})
	log.Fatal(app.Listen(":" + port))
}

// LoginCredentials contains all the login credentials that are send to the scraper
type LoginCredentials struct {
	Username       string
	Password       string
	ServerLocation string
}

func (lc LoginCredentials) toProto() *pb.SetRtCvLocationRequest {
	return &pb.SetRtCvLocationRequest{
		BasicAuthUsername: lc.Username,
		BasicAuthPassword: lc.Password,
		ServerLocation:    lc.ServerLocation,
	}
}

func pull(loginCredentials LoginCredentials) {
outer:
	for {
		addr := os.Args[len(os.Args)-1]
		if len(os.Args) == 1 {
			addr = "localhost:50051"
		}
		fmt.Printf("trying to connect to " + addr + " ..")

		for {
			err := tryConnectAndSendInit(addr, loginCredentials)
			if err != nil && strings.Contains(err.Error(), "connection refused") {
				time.Sleep(time.Second * 5)
				fmt.Printf(".")
				continue
			}

			fmt.Println()
			if err != nil {
				fmt.Println("could not set RT-CV location, error:", err.Error())
				time.Sleep(time.Second * 5)
				continue outer
			}
			break
		}
	}
}

func tryConnectAndSendInit(addr string, loginCredentials LoginCredentials) error {
	conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return err
	}
	defer conn.Close()

	initClient := pb.NewInitClient(conn)
	_, err = initClient.SetRtCvLocation(context.TODO(), loginCredentials.toProto())
	if err != nil {
		if !strings.Contains(err.Error(), "Unimplemented") {
			return err
		}
		fmt.Printf("\nConnected to %s but the server does not support the Init/SetRtCvLocation command, error: %s", addr, err.Error())
	} else {
		fmt.Printf("\nConnected and sended the login credentials to %s", addr)
	}

	conn.WaitForStateChange(context.TODO(), conn.GetState())

	return nil
}
