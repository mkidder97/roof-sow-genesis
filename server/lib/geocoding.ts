// Geocoding Service
import fetch from 'node-fetch';
import { GeocodeResult } from '../types';

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    // Using OpenCage Geocoding API (free tier available)
    const OPENCAGE_KEY = process.env.OPENCAGE_API_KEY || 'demo_key';
    const encodedAddress = encodeURIComponent(address);
    
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${OPENCAGE_KEY}&countrycode=us&limit=1`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.components;
      
      // Get elevation from NOAA
      const elevation = await getElevation(result.geometry.lat, result.geometry.lng);
      
      return {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        city: components.city || components.town || components.village || 'Unknown',
        county: components.county || 'Unknown County',
        state: components.state_code || components.state || 'Unknown State',
        elevation
      };
    }
    
    throw new Error(`No geocoding results found for address: ${address}`);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback for demo purposes - parse address manually
    console.log('🔄 Using fallback geocoding...');
    return fallbackGeocode(address);
  }
}

async function getElevation(lat: number, lng: number): Promise<number> {
  try {
    // NOAA Elevation API
    const response = await fetch(
      `https://nationalmap.gov/epqs/pqs.php?x=${lng}&y=${lat}&units=Feet&output=json`
    );
    
    const data = await response.json();
    return Math.round(parseFloat(data.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation));
    
  } catch (error) {
    console.warn('Elevation lookup failed, using default:', error);
    return 500; // Default elevation
  }
}

// Fallback geocoding for demo purposes
function fallbackGeocode(address: string): GeocodeResult {
  const addressLower = address.toLowerCase();
  
  // Simple pattern matching for demo
  if (addressLower.includes('dallas') || addressLower.includes('tx')) {
    return {
      latitude: 32.7767,
      longitude: -96.7970,
      city: 'Dallas',
      county: 'Dallas County',
      state: 'TX',
      elevation: 430
    };
  } else if (addressLower.includes('miami') || addressLower.includes('fl')) {
    return {
      latitude: 25.7617,
      longitude: -80.1918,
      city: 'Miami',
      county: 'Miami-Dade County',
      state: 'FL',
      elevation: 6
    };
  } else if (addressLower.includes('houston')) {
    return {
      latitude: 29.7604,
      longitude: -95.3698,
      city: 'Houston',
      county: 'Harris County',
      state: 'TX',
      elevation: 80
    };
  } else if (addressLower.includes('austin')) {
    return {
      latitude: 30.2672,
      longitude: -97.7431,
      city: 'Austin',
      county: 'Travis County',
      state: 'TX',
      elevation: 489
    };
  }
  
  // Default fallback
  return {
    latitude: 32.7767,
    longitude: -96.7970,
    city: 'Default City',
    county: 'Default County',
    state: 'TX',
    elevation: 500
  };
}
