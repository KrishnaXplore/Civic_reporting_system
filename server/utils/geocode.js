const axios = require('axios');

/**
 * Reverse geocode coordinates using OpenStreetMap Nominatim.
 * Free — no API key needed.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ state, city, district, ward, locality, pincode, country }}
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', addressdetails: 1 },
      headers: { 'User-Agent': 'CivicConnect/1.0' },
      timeout: 8000,
    });

    const addr = response.data?.address || {};

    return {
      country:  addr.country       || '',
      state:    addr.state         || '',
      city:     addr.city || addr.town || addr.village || addr.county || '',
      district: addr.state_district || addr.district || '',
      ward:     addr.suburb || addr.neighbourhood || addr.quarter || '',
      locality: addr.road || addr.locality || '',
      pincode:  addr.postcode || '',
    };
  } catch (err) {
    console.warn('[Geocode] Nominatim failed:', err.message);
    return { country: '', state: '', city: '', district: '', ward: '', locality: '', pincode: '' };
  }
};

module.exports = { reverseGeocode };
