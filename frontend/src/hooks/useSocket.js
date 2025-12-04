// frontend/src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Crear conexión socket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado a Socket.io:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.io');
    });

    socketRef.current.on('error', (error) => {
      console.error('❌ Error en Socket.io:', error);
    });

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('🔌 Socket desconectado');
      }
    };
  }, []);

  return socketRef.current;
};