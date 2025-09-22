import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Create an HTTP server for health checks and reverse proxies
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
});

// Attach WebSocket server to the HTTP server so proxies can upgrade
const wss = new WebSocketServer({ noServer: true });

// Explicitly handle HTTP upgrade for better proxy compatibility
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
});

// Heartbeat to keep connections alive behind proxies
function startHeartbeat() {
    const heartbeatIntervalMs = 30000;
    const interval = setInterval(() => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try { client.ping(); } catch (e) {}
            }
        });
    }, heartbeatIntervalMs);
    return interval;
}

startHeartbeat();

let sharedContent = '';

// Add error handling
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send current content on connection
    ws.send(JSON.stringify({ type: 'update', content: sharedContent }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'update') {
                sharedContent = data.content;
                // Broadcast update to all clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        // Send the update message
                        client.send(JSON.stringify({
                            type: 'update',
                            content: sharedContent,
                            timestamp: new Date().toISOString()
                        }));
                        // Send the log message
                        client.send(JSON.stringify({
                            type: 'log',
                            message: 'User Updated',
                            content: sharedContent,
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});