import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './socketContextDef';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('almedika_user') || localStorage.getItem('almedika_user');
    let token = null;
    try {
      token = saved ? JSON.parse(saved)?.token : null;
    } catch {}

    // Connect directly to backend port 5000
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      auth: { token }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('prescription:new', (newRx) => {
      setIncomingAlert({
        type: 'prescription:new',
        title: newRx.is_cito ? '🚨 RESEP CITO MASUK!' : '📋 E-Resep Baru Diterima',
        message: `${newRx.patient_name} (${newRx.medical_record_number}) - ${newRx.item_count} item obat`,
        isCito: Boolean(newRx.is_cito),
        timestamp: new Date().toLocaleTimeString(),
      });

      // Play soft notification beep using Web Audio API (no external file needed)
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = newRx.is_cito ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(newRx.is_cito ? 880 : 587.33, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.6);
        }
      } catch (e) {
        console.log('Audio context play failed:', e);
      }
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, incomingAlert, setIncomingAlert }}>
      {children}
    </SocketContext.Provider>
  );
}
