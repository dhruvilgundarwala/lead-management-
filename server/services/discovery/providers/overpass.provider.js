const axios = require('axios');

class OverpassProvider {
  constructor() {
    this.endpoint = 'https://overpass-api.de/api/interpreter';
  }

  buildQuery(category, city) {
    return `
      [out:json][timeout:25];
      (
        area["name"="${city}"];
        area["name:en"="${city}"];
      )->.searchArea;
      (
        node["shop"~"${category}",i](area.searchArea);
        way["shop"~"${category}",i](area.searchArea);
        node["amenity"~"${category}",i](area.searchArea);
        way["amenity"~"${category}",i](area.searchArea);
        node["office"~"${category}",i](area.searchArea);
        way["office"~"${category}",i](area.searchArea);
      );
      out center;
    `;
  }

  async search(params) {
    try {
      const { category, location, limit = 20 } = params;
      const city = location?.city;
      if (!city || !category) {
        throw new Error('City and category are required for Overpass search');
      }

      const searchTerm = category.replace(/_/g, '.*');
      const query = this.buildQuery(searchTerm, city);
      
      const response = await axios.post(this.endpoint, `data=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AILeadFinder/1.0 (contact@aileadfinder.com)'
        },
        timeout: 10000
      });

      return this.normalizeData(response.data.elements, category).slice(0, limit);
    } catch (error) {
      console.error('Overpass API Error:', error.message);
      return [];
    }
  }

  normalizeData(elements, defaultCategory) {
    if (!elements || !Array.isArray(elements)) return [];
    
    return elements.map(el => {
      const tags = el.tags || {};
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      
      return {
        externalId: `osm_${el.id}`,
        name: tags.name || 'Unknown Business',
        category: tags.shop || tags.amenity || tags.office || defaultCategory,
        address: tags['addr:street'] 
          ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() 
          : null,
        city: tags['addr:city'],
        state: tags['addr:state'],
        country: tags['addr:country'],
        latitude: lat,
        longitude: lon,
        phone: tags.phone || tags['contact:phone'] || null,
        email: tags.email || tags['contact:email'] || null,
        website: tags.website || tags['contact:website'] || null,
        source: 'OpenStreetMap',
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`
      };
    }).filter(biz => biz.name !== 'Unknown Business');
  }
}

module.exports = new OverpassProvider();
