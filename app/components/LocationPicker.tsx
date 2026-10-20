
"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

export type MapLocation = {
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  position: MapLocation;
  onChange: (location: MapLocation) => void;
};

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onChange,
}: {
  onChange: (location: MapLocation) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapCenter({ position }: { position: MapLocation }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), {
      duration: 0.7,
    });
  }, [map, position.lat, position.lng]);

  return null;
}

export default function LocationPicker({
  position,
  onChange,
}: LocationPickerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        scrollWheelZoom
        style={{ height: "380px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter position={position} />
        <MapClickHandler onChange={onChange} />

        <Marker
          position={[position.lat, position.lng]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend(event) {
              const point = event.target.getLatLng();
              onChange({ lat: point.lat, lng: point.lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
