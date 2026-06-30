const axios = require('axios');

// Haversine distance (meters)
function haversine(a, b) {
  const toRad = v => v * Math.PI / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat/2);
  const sinDLon = Math.sin(dLon/2);
  const aa = sinDLat*sinDLat + sinDLon*sinDLon * Math.cos(lat1)*Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return R * c;
}

/**
 * Precise detour calculation:
 * - If GOOGLE_MAPS_API_KEY is provided via env, call the Directions API to compute
 *   real-world driving distance for the base route and the route with the add-on.
 * - Otherwise, fall back to approximate detour = distance(origin->pickup) + distance(drop->destination) - baseRouteApprox.
 *
 * Note: Calling Directions API twice (base + with-waypoint) gives accurate detour.
 */
async function calculateExtraDetourMeters(orderRoute, addonPickup, addonDrop) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  try {
    if (key) {
      // orderRoute expected { origin:{lat,lng}, destination:{lat,lng} }
      const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

      const baseRes = await axios.get(baseUrl, { params: {
        origin: `${orderRoute.origin.lat},${orderRoute.origin.lng}`,
        destination: `${orderRoute.destination.lat},${orderRoute.destination.lng}`,
        key
      }});

      const viaRes = await axios.get(baseUrl, { params: {
        origin: `${orderRoute.origin.lat},${orderRoute.origin.lng}`,
        destination: `${orderRoute.destination.lat},${orderRoute.destination.lng}`,
        waypoints: `via:${addonPickup.lat},${addonPickup.lng}|via:${addonDrop.lat},${addonDrop.lng}`,
        key
      }});

      const baseDist = (baseRes.data.routes?.[0]?.legs || []).reduce((s,l)=>s+(l.distance?.value||0),0);
      const viaDist = (viaRes.data.routes?.[0]?.legs || []).reduce((s,l)=>s+(l.distance?.value||0),0);
      return viaDist - baseDist;
    }
  } catch (e) {
    // fall through to fallback
    console.warn('Directions API failed, using approximate detour', e.message);
  }

  // Fallback approximate calculation
  const baseApprox = haversine(orderRoute.origin, orderRoute.destination);
  const addApprox = haversine(orderRoute.origin, addonPickup) + haversine(addonPickup, addonDrop) + haversine(addonDrop, orderRoute.destination);
  return Math.max(0, addApprox - baseApprox);
}

module.exports = { calculateExtraDetourMeters, haversine };
