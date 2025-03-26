const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'test-xss.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading test page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else if (req.url === '/redirect') {
        // 301 Permanent Redirect to malicious domain
        res.writeHead(301, {
            'Location': 'https://malicious-site.com',
            'Content-Type': 'text/plain'
        });
        res.end('Redirecting to malicious site...');
    } else if (req.url === '/test-playwright-connection') {
        // Try to connect to Playwright WebSocket server
        const ws = new WebSocket('ws://localhost:3000');

        ws.on('open', () => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Successfully connected to Playwright WebSocket server!');
            ws.close();
        });

        ws.on('error', (error) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Failed to connect to Playwright WebSocket server: ${error.message}`);
        });
    }
});

const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
}); 