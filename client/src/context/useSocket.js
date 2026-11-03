import { useContext } from 'react';
import { SocketContext } from './socketContextDef';

export function useSocket() {
  return useContext(SocketContext);
}
