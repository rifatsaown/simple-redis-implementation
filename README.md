# Simple Redis Cache with Express

A minimal Node.js + Express server that caches a public API response in Redis. It demonstrates:

- Bootstrapping a Redis client with robust reconnect logic
- Using Redis as a cache with TTL (time-to-live)
- A simple request counter for cache hits

The single endpoint GET / fetches todos from https://jsonplaceholder.typicode.com/todos, caches the result for 10 seconds, and serves from cache on subsequent requests within that window.

## Prerequisites

- Node.js 18+ (for built-in fetch) and npm or pnpm
- Docker Desktop (to run Redis in a container)

Note: This project uses ES modules (import ... from '...'). If you run into module errors, add "type": "module" to your package.json.

## Quick start

### 1) Start Redis in Docker

PowerShell (Windows):

```powershell
# Pull a recent Redis image
docker pull redis:7-alpine

# Run Redis exposing default port 6379
# - --name redis         : container name
# - -p 6379:6379         : map host:container port
# - --restart unless-stopped : auto-restart on reboot/crash

docker run -d --name redis -p 6379:6379 --restart unless-stopped redis:7-alpine

# (Optional) Verify Redis is accepting connections
# If you have redis-cli available in the container image
# docker exec -it redis redis-cli PING
```

If you already have a Redis container running, you can skip this step.

### 2) Install dependencies

Using pnpm (recommended as pinned in package.json):

```powershell
pnpm install
```

Or with npm:

```powershell
npm install
```

### 3) Configure environment

Defaults are sensible for local Docker.

- REDIS_HOST: localhost
- REDIS_PORT: 6379
- REDIS_DB: 0

You can export them for your current PowerShell session if needed:

```powershell
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:REDIS_DB   = "0"
```

### 4) Run the server

Development (with nodemon):

```powershell
pnpm dev
```

Production-ish run:

```powershell
pnpm start
```

The app listens on http://localhost:3000.

## How it works

- On startup, the app connects to Redis using settings from environment variables (see redis.js).
- When you call GET /:
  1.  It checks Redis for the key todos.
  2.  If present, it increments a count key and serves cached data.
  3.  If absent, it fetches from the API, stores the result under todos with a 10-second TTL, resets count to 0, and serves the fresh response.

Key names used:

- todos: cached JSON of the API response
- count: number of consecutive cache hits since the last API refresh

## Try it

```powershell
# First request: populates cache from API, resets count to 0
curl http://localhost:3000/

# Subsequent requests within 10s: served from cache and increments count
curl http://localhost:3000/
```

Watch your terminal logs for messages like "Serving from cache" and the current count.

## Project structure

- server.js: Express application and route handling
- redis.js: Redis client initialization and lifecycle events
- package.json: Scripts and dependencies (pnpm is the pinned package manager)

## Scripts

```json
{
  "scripts": {
    "start": " node server.js",
    "dev": "nodemon server.js"
  }
}
```

- pnpm dev runs with autoreload via nodemon
- pnpm start runs the server directly

## Configuration

Environment variables (all optional with defaults):

- REDIS_HOST: hostname of Redis (default: localhost)
- REDIS_PORT: port for Redis (default: 6379)
- REDIS_DB: logical Redis DB index (default: 0)

## Troubleshooting

- Cannot find module / ES module errors
  - Ensure Node 18+ and consider adding "type": "module" to package.json.
- ECONNREFUSED connecting to Redis
  - Confirm the Docker container is running and port 6379 is exposed.
  - Check your env vars match where Redis is running (host/port).
- Requests are slow every ~10 seconds
  - That’s expected when the cache expires. The first request after expiration refills the cache from the API.

## Optional: docker-compose

If you prefer using docker-compose, create a compose.yaml like this:

```yaml
services:
	redis:
		image: redis:7-alpine
		container_name: redis
		ports:
			- "6379:6379"
		restart: unless-stopped
```

Then run:

```powershell
docker compose up -d
```

## License

ISC
