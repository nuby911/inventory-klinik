import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);

  useEffect(() => {
    // Connect to current host / proxy
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    socketInstance.on('prescription:new', (newRx) => {
      console.log('Real-time prescription received:', newRx);
      setIncomingAlert({
        type: 'prescription:new',
        title: newRx.is_cito ? '🚨 RESEP CITO MASUK!' : '📋 E-Resep Baru Diterima',
        message: `${newRx.patient_name} (${newRx.medical_record_number}) - ${newRx.item_count} item obat`,
        isCito: Boolean(newRx.is_cito),
        timestamp: new Date().toLocaleTimeString(),
      });

      // Play soft notification beep using Web Audio API (no external file needed)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = newRx.is_cito ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(newRx.is_cito ? 880 : 587.33, audioCtx.currentTime); // A5 or D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {
        console.log('Audio context play failed:', e);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, incomingAlert, setIncomingAlert }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
