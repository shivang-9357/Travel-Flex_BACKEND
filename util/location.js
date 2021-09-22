const axios = require('axios');

const HttpError = require('../models/http-error');

//const API_KEY = 'AkrIzusk2InF94nhdSc6Y75ONDTSTrU9BtBvQBViDHMBss9YVEmURRzmAkcdHaAO';
const API_KEY = process.env.BING_API_KEY;

async function getCoordsForAddress(address) {

  const response = await axios.get(
    `http://dev.virtualearth.net/REST/v1/Locations/${encodeURIComponent(address)}?&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  const coordinates = data.resourceSets[0].resources[0].point.coordinates;

  return coordinates;
}

module.exports = getCoordsForAddress;