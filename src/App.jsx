import { useState, useEffect, useCallback } from 'react';

function App() {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [content, setContent] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const wsUrl = import.meta.env.PROD
            ? import.meta.env.VITE_WS_URL
            : 'ws://localhost:3000';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            setConnected(true);
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
                setContent(data.content);
            } else if (data.type === 'log') {
                setMessages(prev => [...prev, {
                    timestamp: data.timestamp,
                    message: data.message,
                    content: data.content
                }]);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnected(false);
        };

        // Cleanup on unmount
        return () => {
            if (ws) ws.close();
        };
    }, []);

    // Debounce function to delay updates
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Debounced send function
    const sendUpdate = useCallback(
        debounce((newContent) => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'update',
                    content: newContent
                }));
            }
        }, 1000), // Wait 1 second after last keystroke
        [socket]
    );

    const handleTextChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        sendUpdate(newContent);
    };

    return (
        <div style={{
            backgroundColor: '#000000',
            minHeight: '100vh',
            color: 'white',
            padding: '20px'
        }}>
            <h1 style={{
                textAlign: 'center',
                fontSize: '2.5rem',
                marginBottom: '2rem'
            }}>
                WELCOME
            </h1>

            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <div style={{
                    marginBottom: '10px',
                    color: connected ? '#4CAF50' : '#f44336'
                }}>
                    Status: {connected ? 'Connected' : 'Disconnected'}
                </div>

                <textarea
                    value={content}
                    onChange={handleTextChange}
                    placeholder="Type Here..."
                    style={{
                        width: '100%',
                        height: '200px',
                        backgroundColor: '#4A4A4A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '15px',
                        marginBottom: '2rem',
                        resize: 'none',
                        fontSize: '16px'
                    }}
                />

                <h2 style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem'
                }}>
                    LOGS
                </h2>

                <div style={{
                    backgroundColor: '#4A4A4A',
                    borderRadius: '10px',
                    padding: '15px'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ 
                                    textAlign: 'left', 
                                    padding: '8px',
                                    borderBottom: '1px solid #666',
                                    width: '250px'
                                }}>Timestamp</th>
                                <th style={{ 
                                    textAlign: 'left', 
                                    padding: '8px',
                                    borderBottom: '1px solid #666',
                                    width: '150px'
                                }}>Message</th>
                                <th style={{ 
                                    textAlign: 'left', 
                                    padding: '8px',
                                    borderBottom: '1px solid #666'
                                }}>Content</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((msg, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '8px' }}>
                                        {msg.timestamp}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        {msg.message}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        {msg.content}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default App;
