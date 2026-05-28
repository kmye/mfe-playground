package config_test

import (
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_ONE_VERSION", "2.1.0")
	os.Setenv("REMOTE_TWO_URL", "http://remote-two.example.com/mf-manifest.json")
	os.Setenv("REMOTE_TWO_VERSION", "1.4.0")
	os.Setenv("PORT", "9090")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
		os.Unsetenv("REMOTE_TWO_URL")
		os.Unsetenv("REMOTE_TWO_VERSION")
		os.Unsetenv("PORT")
	}()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.Remotes["remote_one"].URL != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote_one URL: %s", cfg.Remotes["remote_one"].URL)
	}
	if cfg.Remotes["remote_one"].Version != "2.1.0" {
		t.Errorf("unexpected remote_one version: %s", cfg.Remotes["remote_one"].Version)
	}
	if cfg.Remotes["remote_two"].URL != "http://remote-two.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote_two URL: %s", cfg.Remotes["remote_two"].URL)
	}
	if cfg.Remotes["remote_two"].Version != "1.4.0" {
		t.Errorf("unexpected remote_two version: %s", cfg.Remotes["remote_two"].Version)
	}
}

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_ONE_VERSION")
	os.Unsetenv("REMOTE_TWO_URL")
	os.Unsetenv("REMOTE_TWO_VERSION")
	os.Unsetenv("PORT")

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.Remotes["remote_one"].URL != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("unexpected default remote_one URL: %s", cfg.Remotes["remote_one"].URL)
	}
	if cfg.Remotes["remote_one"].Version != "0.0.0" {
		t.Errorf("unexpected default remote_one version: %s", cfg.Remotes["remote_one"].Version)
	}
}

func TestRemoteEntryShape(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_ONE_VERSION", "2.1.0")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
	}()

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("expected URL from env, got %s", entry.URL)
	}
	if entry.Version != "2.1.0" {
		t.Errorf("expected version 2.1.0, got %s", entry.Version)
	}
}

func TestRemoteEntryDefaultVersion(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_ONE_VERSION")

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("expected default URL, got %s", entry.URL)
	}
	if entry.Version != "0.0.0" {
		t.Errorf("expected default version 0.0.0, got %s", entry.Version)
	}
}
