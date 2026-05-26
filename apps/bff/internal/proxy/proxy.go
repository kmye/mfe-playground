package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func New(targetURL string) http.Handler {
	target, _ := url.Parse(targetURL)
	rp := httputil.NewSingleHostReverseProxy(target)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api/proxy")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
		rp.ServeHTTP(w, r)
	})
}
