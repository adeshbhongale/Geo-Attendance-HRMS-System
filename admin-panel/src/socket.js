import { io } from 'socket.io-client';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const cleanApiUrl = rawApiUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
const SOCKET_URL = cleanApiUrl.replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['polling', 'websocket'] // Match server-allowed transports
});

export default socket;
