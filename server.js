import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8082 }, () => {
    console.log('WebSocket server running on port 8082');
});

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