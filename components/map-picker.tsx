"use client";

import { useCallback, useState, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
};

// Default center: Harare, Zimbabwe
const defaultCenter = {
  lat: -17.8252,
  lng: 31.0335,
};

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

function MapPickerComponent({
  onLocationSelect,
  initialLat,
  initialLng,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : defaultCenter
  );

  const getAddressFromCoordinates = useCallback(
    async (lat: number, lng: number) => {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng },
        });

        if (response.results && response.results[0]) {
          return response.results[0].formatted_address;
        }
        return undefined;
      } catch (error) {
        console.error("Error getting address:", error);
        return undefined;
      }
    },
    []
  );

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });

        const address = await getAddressFromCoordinates(lat, lng);
        onLocationSelect(lat, lng, address);
      }
    },
    [onLocationSelect, getAddressFromCoordinates]
  );

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          setMapCenter({ lat, lng });

          const address = await getAddressFromCoordinates(lat, lng);
          onLocationSelect(lat, lng, address);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your location. Please click on the map to set the location manually."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  }, [onLocationSelect, getAddressFromCoordinates]);

  if (loadError) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-destructive">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Click on the map to select your school&apos;s location
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Use My Location
        </Button>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={markerPosition ? 15 : 12}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            animation={google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>

      {markerPosition && (
        <div className="text-sm text-muted-foreground bg-muted hidden p-3 rounded-md">
          <p className="font-medium">Selected Location:</p>
          <p>
            Latitude: {markerPosition.lat.toFixed(6)}, Longitude:{" "}
            {markerPosition.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}

export const MapPicker = memo(MapPickerComponent);
