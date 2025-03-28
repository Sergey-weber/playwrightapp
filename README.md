# Secure Screenshot Service

A secure Node.js application that takes screenshots using Playwright with remote connection. The application runs in a sandboxed environment with strict security measures.

## Features

- Secure remote connection to Playwright server
- Domain whitelisting for security
- Sandboxed browser environment
- Docker containerization
- Health check endpoint

## Prerequisites

- Docker and Docker Compose
- Node.js 18 or higher (for local development)

## Configuration

The application can be configured through environment variables:

- `PORT`: Application port (default: 3001)
- `PLAYWRIGHT_WS_ENDPOINT`: WebSocket endpoint for Playwright server
- `ALLOWED_DOMAINS`: Comma-separated list of allowed domains

## Running with Docker

1. Build and start the containers:
```bash
npm run docker:up
```

2. Stop the containers:
```bash
npm run docker:down
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

2. Run for testing xss:
```bash
npm run dev
```

Check processes in container
```
docker exec -it $(docker ps -q -f name=playwright-server) top
```

## API Endpoints

### POST /screenshot
Takes a screenshot of the specified URL.

Request body:
```json
{
  "url": "https://example.com"
}
```

Response: PNG image

```
curl -X POST -H "Content-Type: application/json" -d '{"url":"http://host.docker.internal:3002"}' http://localhost:3001/screenshot -o test-result.jpg

curl -X POST -H "Content-Type: application/json" -d '{"url":"http://google.com"}' http://localhost:3001/screenshot -o screenshot.jpg
```

### GET /health
Health check endpoint.

Response:
```json
{
  "status": "ok"
}
```

## Security Features

- Domain whitelisting
- Sandboxed browser environment
- No storage state persistence
- Restricted permissions
- Custom user agent
- HTTPS enforcement
- Request routing control

## License

MIT