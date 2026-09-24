import { useEffect, useState } from 'react';

export function useBotEvents() {
  const [latestEvent, setLatestEvent] = useState<any>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    // Fetch dynamic bot URL for the logged-in client
    fetch('/api/bot-url')
      .then((res) => res.json())
      .then(({ url }) => {
        if (!url) return;
        
        // Ya no conectamos directo al Bot VPS para evitar Mixed Content HTTP -> HTTPS.
        // Ahora usamos el proxy interno de Next.js que está en el mismo dominio HTTPS.
        eventSource = new EventSource(`/api/proxy/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            console.log('[SSE] Nuevo evento recibido del bot:', parsedData);
            setLatestEvent(parsedData);
          } catch (error) {
            if (event.data !== ': ping') {
               console.error('Error parseando el evento SSE:', error);
            }
          }
        };

        eventSource.onerror = (error) => {
          console.error('[SSE] Error en la conexión:', error);
          eventSource?.close();
        };
      })
      .catch((err) => console.error('Error fetching bot URL:', err));

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return latestEvent;
}
