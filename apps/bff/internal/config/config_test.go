package config_test

import (
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_TWO_URL", "http://remote-two.example.com/mf-manifest.json")
	os.Setenv("PORT", "9090")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_TWO_URL")
		os.Unsetenv("PORT")
	}()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.Remotes["remote-one"] != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote-one URL: %s", cfg.Remotes["remote-one"])
	}
	if cfg.Remotes["remote-two"] != "http://remote-two.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote-two URL: %s", cfg.Remotes["remote-two"])
	}
}

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_TWO_URL")
	os.Unsetenv("PORT")

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.Remotes["remote-one"] != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("unexpected default remote-one URL: %s", cfg.Remotes["remote-one"])
	}
}
