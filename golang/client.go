package main

import (
	"golang.org/x/net/websocket"
	"fmt"
	"log"
	"time"
	"sync"
	"runtime"
	"github.com/bradfitz/iter"
	"math/rand"
)

var ORIGIN = "http://127.0.0.1:8080"
var WS_URL = "ws://127.0.0.1:8080"
var GLOBAL_WG = &sync.WaitGroup{}
var LOG_MSG = false
var BASE_SEND_INTERVAL = 40 // seconds
var TOTAL_CLIENTS_COUNT = 1000
var SINGLE_SPAWN_CLIENTS = 50

func Spawn() {
	ws, err := websocket.Dial(WS_URL, "", ORIGIN)
	if err != nil {
		log.Fatal(err)
		return
	}
	GLOBAL_WG.Add(1)
	defer func() {
		GLOBAL_WG.Done()
		ws.Close()
	}()
	fmt.Println("Connected")

	// Send
	message := []byte("hello, world!")
	interval := time.Duration(rand.Intn(BASE_SEND_INTERVAL) + 1) * time.Second
	timer := &IntervalTimer{Interval: interval, Wg: GLOBAL_WG, Job: func() {
		_, err = ws.Write(message)
		if err != nil {
			log.Fatal(err)
		}
		if LOG_MSG {
			fmt.Printf("Send: %s\n", message)
		}
	}}
	timer.Start()

	// Read
	for {
		var msg = make([]byte, 512)
		m, err := ws.Read(msg)
		if err != nil {
			log.Fatal(err)
		}
		if LOG_MSG {
			fmt.Printf("Receive: %s\n", msg[:m])
		}
	}

}

type IntervalTimer struct {
	Ticker *time.Ticker
	Interval time.Duration
	Job func()
	Wg *sync.WaitGroup
}
func (it *IntervalTimer) Start() {
	it.Ticker = time.NewTicker(it.Interval)
	it.Wg.Add(1)
	go func() {
		for range it.Ticker.C {
			it.Job()
		}
	}()
}
func (it *IntervalTimer) Stop() {
	it.Ticker.Stop()
	it.Wg.Done()
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	fmt.Println("Clients start...")

	for range iter.N(TOTAL_CLIENTS_COUNT / SINGLE_SPAWN_CLIENTS) {
		for range iter.N(SINGLE_SPAWN_CLIENTS) {
			go Spawn()
		}
		fmt.Printf("%d clients spawned\n", SINGLE_SPAWN_CLIENTS)
		time.Sleep(3 * time.Second)
	}

	for {
		time.Sleep(time.Second)
	}
}