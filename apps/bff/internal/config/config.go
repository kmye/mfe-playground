package config

import "os"

type Config struct {
	Port         string
	HostDistPath string
	Remotes      map[string]string
}

func Load() Config {
	return Config{
		Port:         envOrDefault("PORT", "8080"),
		HostDistPath: envOrDefault("HOST_DIST_PATH", "../../host/dist"),
		Remotes: map[string]string{
			"remote-one": envOrDefault("REMOTE_ONE_URL", "http://localhost:3001/mf-manifest.json"),
			"remote-two": envOrDefault("REMOTE_TWO_URL", "http://localhost:3002/mf-manifest.json"),
		},
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
