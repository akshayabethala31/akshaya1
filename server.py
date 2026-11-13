
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", 10000))

server = ThreadingHTTPServer(
    ("0.0.0.0", PORT),
    SimpleHTTPRequestHandler
)

print(f"Diet Prediction System running on port {PORT}")

server.serve_forever()
