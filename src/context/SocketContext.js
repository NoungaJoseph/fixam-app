import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketInitializedRef = React.useRef(false);
  const socketRef = React.useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      socketInitializedRef.current = false;
      return;
    }

    // Prevent multiple socket instances
    if (socketInitializedRef.current) {
      return;
    }

    socketInitializedRef.current = true;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      randomizationFactor: 0.5,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 15000,
      reconnectionAttempts: 20,
      timeout: 20000
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Mobile App Socket Connected');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Mobile App Socket Disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.log('Socket Connection Error:', err.message);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInitializedRef.current = false;
      socketRef.current = null;
      socketInstance.disconnect();
    };
  }, [token]);

  const emit = useCallback((event, data) => {
    if (socket) socket.emit(event, data);
  }, [socket]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};
