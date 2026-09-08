import React, { useEffect, useState } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="banner-offline"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-bounce"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <div>
        <span className="font-bold">Modo Sin Conexión:</span> Estás visualizando los recursos en caché local. Las funciones de IA en vivo se reanudarán al reconectar.
      </div>
    </div>
  );
};
