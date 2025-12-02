import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface Marker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    color?: string;
}

interface LeafletMapProps {
    latitude: number;
    longitude: number;
    markers?: Marker[];
    onMapClick?: (lat: number, lng: number) => void;
    isInteractive?: boolean;
}

export default function LeafletMap({ latitude, longitude, markers = [], onMapClick, isInteractive = true }: LeafletMapProps) {
    const webViewRef = useRef<WebView>(null);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${latitude}, ${longitude}], 15);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
          }).addTo(map);

          var markersData = ${JSON.stringify(markers)};
          
          markersData.forEach(function(m) {
            var color = m.color === 'green' ? 'green' : 'red';
            // Simple circle marker for performance and look
            L.circleMarker([m.latitude, m.longitude], {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map).bindPopup(m.title || '');
          });

          // Custom marker for current location
          L.circleMarker([${latitude}, ${longitude}], {
              radius: 10,
              fillColor: '#2563eb',
              color: '#fff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.8
          }).addTo(map);

          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'click',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });
        </script>
      </body>
    </html>
  `;

    return (
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={{ flex: 1 }}
            onMessage={(event) => {
                if (onMapClick) {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'click') {
                        onMapClick(data.lat, data.lng);
                    }
                }
            }}
        />
    );
}
