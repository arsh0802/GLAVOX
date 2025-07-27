import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(serverUrl: string = 'http://localhost:5000'): void {
    if (!this.socket) {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public sendSignLanguageData(data: { gesture: string; text: string }): void {
    if (this.socket) {
      this.socket.emit('sign_language_data', data);
    }
  }

  public onSignLanguageResult(callback: (data: { gesture: string; text: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('sign_language_result', callback);
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default WebSocketService; 