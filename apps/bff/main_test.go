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
	os.Setenv("REMOTE_ONE_VERSION", "1.2.3")
	os.Setenv("REMOTE_TWO_URL", "http://two.test/mf-manifest.json")
	os.Setenv("REMOTE_TWO_VERSION", "2.0.0")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
		os.Unsetenv("REMOTE_TWO_URL")
		os.Unsetenv("REMOTE_TWO_VERSION")
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
		Remotes map[string]config.RemoteEntry `json:"remotes"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	entry := resp.Remotes["remote_one"]
	if entry.URL != "http://one.test/mf-manifest.json" {
		t.Errorf("unexpected remote_one URL: %s", entry.URL)
	}
	if entry.Version != "1.2.3" {
		t.Errorf("unexpected remote_one version: %s", entry.Version)
	}

	entry2 := resp.Remotes["remote_two"]
	if entry2.URL != "http://two.test/mf-manifest.json" {
		t.Errorf("unexpected remote_two URL: %s", entry2.URL)
	}
	if entry2.Version != "2.0.0" {
		t.Errorf("unexpected remote_two version: %s", entry2.Version)
	}
}
