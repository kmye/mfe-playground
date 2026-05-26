package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"mfe-poc/bff/internal/config"
	"mfe-poc/bff/internal/proxy"
	"mfe-poc/bff/internal/static"
)

func main() {
	cfg := config.Load()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"remotes": cfg.Remotes,
		})
	})

	mux.Handle("/api/proxy/", proxy.New("http://localhost:9999"))

	mux.Handle("/", static.New(cfg.HostDistPath))

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("BFF listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
