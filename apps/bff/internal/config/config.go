package config

import "os"

type RemoteEntry struct {
	URL     string `json:"url"`
	Version string `json:"version"`
}

type Config struct {
	Port         string
	HostDistPath string
	Remotes      map[string]RemoteEntry
}

func Load() Config {
	return Config{
		Port:         envOrDefault("PORT", "8080"),
		HostDistPath: envOrDefault("HOST_DIST_PATH", "../../host/dist"),
		Remotes: map[string]RemoteEntry{
			"remote_one": {
				URL:     envOrDefault("REMOTE_ONE_URL", "http://localhost:3001/mf-manifest.json"),
				Version: envOrDefault("REMOTE_ONE_VERSION", "0.0.0"),
			},
			"remote_two": {
				URL:     envOrDefault("REMOTE_TWO_URL", "http://localhost:3002/mf-manifest.json"),
				Version: envOrDefault("REMOTE_TWO_VERSION", "0.0.0"),
			},
			"remote_vue": {
				URL:     envOrDefault("REMOTE_VUE_URL", "http://localhost:3003/mf-manifest.json"),
				Version: envOrDefault("REMOTE_VUE_VERSION", "0.0.0"),
			},
			"remote_svelte": {
				URL:     envOrDefault("REMOTE_SVELTE_URL", "http://localhost:3004/mf-manifest.json"),
				Version: envOrDefault("REMOTE_SVELTE_VERSION", "0.0.0"),
			},
		},
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
