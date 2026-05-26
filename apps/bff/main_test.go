package main_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestConfigEndpoint(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://one.test/mf-manifest.json")
	os.Setenv("REMOTE_TWO_URL", "http://two.test/mf-manifest.json")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_TWO_URL")
	}()

	cfg := config.Load()

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"remotes": cfg.Remotes,
		})
	})

	req := httptest.NewRequest("GET", "/api/config", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var resp struct {
		Remotes map[string]string `json:"remotes"`
	}
	json.NewDecoder(rec.Body).Decode(&resp)

	if resp.Remotes["remote-one"] != "http://one.test/mf-manifest.json" {
		t.Errorf("unexpected remote-one: %s", resp.Remotes["remote-one"])
	}
}
