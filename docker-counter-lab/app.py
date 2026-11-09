
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

import redis

store = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=6379,
    socket_connect_timeout=2,
    socket_timeout=2,
)

label = os.getenv("APP_LABEL", "Docker Lab")
counter_key = os.getenv("COUNTER_KEY", "visits")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        try:
            if path == "/health":
                store.ping()
                status, data = 200, {"status": "ok"}
            elif path == "/":
                count = store.incr(counter_key)
                status, data = 200, {"app": label, "visits": count}
            else:
                status, data = 404, {"error": "not found"}
        except redis.RedisError as error:
            print(f"Redis unavailable: {error}", flush=True)
            status, data = 503, {"error": "Redis unavailable"}

        body = (json.dumps(data, ensure_ascii=False) + "\n").encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


print(f"Serving {label} on 0.0.0.0:8000", flush=True)
HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
