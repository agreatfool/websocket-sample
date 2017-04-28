package main

import (
	"golang.org/x/net/websocket"
	"fmt"
	"log"
	"net/http"
	"time"
	"sync"
)

var LOG_MSG = false
var REQ_COUNT = 0
var GLOBAL_WG = &sync.WaitGroup{}

type IntervalTimer struct {
	Ticker *time.Ticker
	Interval time.Duration
	Job func()
	Wg *sync.WaitGroup
}
func (it *IntervalTimer) Work() {
	it.Ticker = time.NewTicker(it.Interval)
	it.Wg.Add(1)
	go func() {
		for range it.Ticker.C {
			it.Job()
		}
	}()
}
func (it *IntervalTimer) End() {
	it.Ticker.Stop()
	it.Wg.Done()
}

type Server struct {
	Clients []*websocket.Conn
}

func (server *Server) Handle(ws *websocket.Conn) {
	server.Clients = append(server.Clients, ws)
	fmt.Printf("Server: Client connected: %d\n", len(server.Clients))

	for {
		msg := make([]byte, 512)
		n, err := ws.Read(msg)
		if err != nil {
			log.Fatal(err)
		}
		if LOG_MSG {
			fmt.Printf("Receive: %s\n", msg[:n])
		}
		REQ_COUNT++

		for index := range server.Clients {
			m, err := server.Clients[index].Write([]byte(string(msg[:n])))
			if err != nil {
				log.Fatal(err)
			}
			if LOG_MSG {
				fmt.Printf("Send: %s\n", msg[:m])
			}
		}
	}
}

func main() {
	server := &Server{}

	http.Handle("/", websocket.Handler(server.Handle))

	fmt.Println("listening on port: 8080")
	timer := &IntervalTimer{Interval: time.Duration(5) * time.Second, Wg: GLOBAL_WG, Job: func() {
		fmt.Printf("Clients: %d, Requests %d/s\n", len(server.Clients), REQ_COUNT / 5)
		REQ_COUNT =  0
	}}
	timer.Work()

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}