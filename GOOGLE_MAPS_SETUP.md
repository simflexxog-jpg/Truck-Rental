# Google Maps Integration Guide

This document explains how to set up Google Maps integration for the Truck Rental application.

## Getting Started

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

4. Create an API key:
   - Go to Credentials > Create Credentials > API Key
   - Copy your API key

### 2. Configure API Key in Your Application

You have two options:

#### Option A: Direct Configuration (Development)
1. Open `src/app/services/map-config.service.ts`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:
   ```typescript
   private apiKey = 'YOUR_API_KEY_HERE';
   ```

3. Open `src/index.html`
4. Replace `YOUR_GOOGLE_MAPS_API_KEY` in the script tag:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=geometry,drawing,places"></script>
   ```

#### Option B: Environment Variables (Recommended for Production)
1. Create environment files:
   - `src/environments/environment.ts` (development)
   - `src/environments/environment.prod.ts` (production)

2. Add your API key to each file:
   ```typescript
   export const environment = {
     production: false,
     googleMapsApiKey: 'YOUR_API_KEY_HERE'
   };
   ```

3. Update `map-config.service.ts`:
   ```typescript
   import { environment } from '../../../environments/environment';
   
   private apiKey = environment.googleMapsApiKey;
   ```

### 3. API Key Security

- **Never commit API keys to version control**
- Use environment variables in production
- Restrict API key to your domain
- Set usage limits in Google Cloud Console

## Features

### Live Map Monitor (Customer Dashboard)
- Real-time truck location tracking
- Origin and destination markers
- Live route polyline showing travel history
- Current GPS coordinates display
- Route update count tracking

### Route Tracker (Partner Dashboard)
- View all active routes on a single map
- Click routes to highlight them
- See origin, destination, and waypoints
- Route status indicators
- Distance information for each route
- Multi-marker support with route bounds

## Map Services

### MapService (`src/app/services/map.service.ts`)
Manages map markers, routes, and map state:
- `addMarker()` - Add a marker to the map
- `updateMarker()` - Update marker position
- `removeMarker()` - Remove a marker
- `addRoute()` - Add a route (polyline)
- `removeRoute()` - Remove a route
- `setMapCenter()` - Center the map on a location
- `setMapZoom()` - Change map zoom level
- `calculateBounds()` - Calculate bounds for multiple points

### MapConfigService (`src/app/services/map-config.service.ts`)
Handles map configuration and settings:
- API key management
- Default map settings
- Map type, controls, and UI options

## Customization

### Changing Map Styles
Edit the `mapOptions` in the component files to customize map appearance:
```typescript
mapOptions: google.maps.MapOptions = {
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }]
    }
  ]
};
```

### Marker Icons
Customize marker appearance:
```typescript
const marker: google.maps.MarkerOptions = {
  icon: 'https://example.com/marker.png',
  label: 'A',
  title: 'Marker Title'
};
```

### Marker Clustering
For large numbers of markers, consider using marker clustering:
1. Install: `npm install @googlemaps/markerclusterer`
2. Import and use in components

## Troubleshooting

### Map not loading
- Check that your API key is valid
- Ensure the script is loaded in `index.html`
- Check browser console for errors

### Markers not appearing
- Verify marker coordinates are valid (lat: -90 to 90, lng: -180 to 180)
- Check that latitude/longitude property names match (lat/lng, not latitude/longitude)

### API errors
- Check Google Cloud Console for API quota limits
- Verify all required APIs are enabled
- Check browser console for specific error messages

## Additional Resources

- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Angular Google Maps Documentation](https://angular.io/guide/google-maps-overview)
- [Google Maps Styling](https://mapstyle.withgoogle.com/)

## Testing

To test the maps functionality:

1. Navigate to the Customer Dashboard to see Live Map Monitor
2. Navigate to Partner Dashboard to see Route Tracker
3. Create a new tender to see route updates on the map
4. Monitor real-time location tracking (updates every 30 seconds)
