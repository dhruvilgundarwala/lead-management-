/**
 * Maps business categories to the OpenStreetMap tags they are recorded under.
 * Tag reference: https://wiki.openstreetmap.org/wiki/Map_features
 *
 * - tags:    [osmKey, pipe-separated values] pairs, matched exactly. Tag searches use Overpass
 *            indexes and are fast (~3s for a city).
 * - aliases: words that identify the category in free text ("dentist", "dental clinic", ...).
 *
 * Business types not listed here fall back to a (slower) name search, e.g. names containing "solar".
 *
 * All values here are static, trusted strings: they are interpolated into Overpass queries.
 */
const CATEGORIES = {
  restaurant: { label: 'Restaurants', aliases: ['restaurant', 'dining', 'eatery', 'dhaba', 'fast food', 'food'], tags: [['amenity', 'restaurant|fast_food|food_court']] },
  cafe: { label: 'Cafes & Coffee Shops', aliases: ['cafe', 'café', 'coffee', 'tea shop', 'tea stall'], tags: [['amenity', 'cafe'], ['shop', 'coffee|tea']] },
  bakery: { label: 'Bakeries & Sweet Shops', aliases: ['bakery', 'bakeries', 'cake', 'sweet', 'mithai', 'confectioner', 'pastry'], tags: [['shop', 'bakery|pastry|confectionery']] },
  bar: { label: 'Bars & Pubs', aliases: ['bar', 'pub', 'brewery', 'lounge'], tags: [['amenity', 'bar|pub|biergarten']] },
  salon: { label: 'Salons & Beauty', aliases: ['salon', 'beauty', 'parlour', 'parlor', 'hair', 'hairdresser', 'barber', 'spa', 'nail', 'makeup'], tags: [['shop', 'hairdresser|beauty|cosmetics|massage'], ['amenity', 'spa'], ['leisure', 'spa']] },
  gym: { label: 'Gyms & Fitness', aliases: ['gym', 'fitness', 'yoga', 'crossfit', 'workout'], tags: [['leisure', 'fitness_centre|sports_centre'], ['amenity', 'gym']] },
  dentist: { label: 'Dental Clinics', aliases: ['dentist', 'dental', 'orthodont'], tags: [['amenity', 'dentist'], ['healthcare', 'dentist']] },
  doctor: { label: 'Doctors & Clinics', aliases: ['doctor', 'clinic', 'physician', 'hospital', 'medical', 'physiotherap', 'dermatolog'], tags: [['amenity', 'doctors|clinic'], ['healthcare', 'doctor|clinic|physiotherapist']] },
  pharmacy: { label: 'Pharmacies', aliases: ['pharmacy', 'chemist', 'medical store', 'drugstore'], tags: [['amenity', 'pharmacy'], ['shop', 'chemist']] },
  veterinary: { label: 'Vets & Pet Shops', aliases: ['vet', 'veterinar', 'pet'], tags: [['amenity', 'veterinary'], ['shop', 'pet|pet_grooming']] },
  hotel: { label: 'Hotels & Guest Houses', aliases: ['hotel', 'guest house', 'guesthouse', 'hostel', 'motel', 'resort', 'lodge', 'homestay'], tags: [['tourism', 'hotel|guest_house|hostel|motel|apartment']] },
  lawyer: { label: 'Legal Services', aliases: ['lawyer', 'law firm', 'legal', 'attorney', 'advocate', 'solicitor', 'notary'], tags: [['office', 'lawyer|notary']] },
  accounting: { label: 'Accountants & Tax Consultants', aliases: ['accountant', 'accounting', 'ca firm', 'chartered accountant', 'cpa', 'tax', 'bookkeep', 'audit'], tags: [['office', 'accountant|tax_advisor|financial_advisor']] },
  real_estate: { label: 'Real Estate Agents', aliases: ['real estate', 'realtor', 'property', 'estate agent', 'broker'], tags: [['office', 'estate_agent']] },
  insurance: { label: 'Insurance Agents', aliases: ['insurance'], tags: [['office', 'insurance']] },
  architect: { label: 'Architects', aliases: ['architect'], tags: [['office', 'architect']] },
  interior_design: { label: 'Interior Designers', aliases: ['interior', 'decorator', 'home decor', 'modular kitchen'], tags: [['shop', 'interior_decoration|kitchen'], ['craft', 'interior_work|interior_decorator'], ['office', 'interior_design']] },
  plumber: { label: 'Plumbers', aliases: ['plumb'], tags: [['craft', 'plumber']] },
  electrician: { label: 'Electricians', aliases: ['electrician', 'electrical contractor'], tags: [['craft', 'electrician']] },
  carpenter: { label: 'Carpenters & Furniture Makers', aliases: ['carpenter', 'woodwork', 'joiner'], tags: [['craft', 'carpenter|joiner|cabinet_maker']] },
  car_repair: { label: 'Car Repair & Garages', aliases: ['car repair', 'garage', 'mechanic', 'auto repair', 'car service', 'tyre', 'tire'], tags: [['shop', 'car_repair|tyres|car_parts'], ['craft', 'car_repair']] },
  car_dealer: { label: 'Car & Bike Dealers', aliases: ['car dealer', 'car showroom', 'bike showroom', 'motorcycle dealer'], tags: [['shop', 'car|motorcycle']] },
  clothing: { label: 'Clothing & Boutiques', aliases: ['clothing', 'clothes', 'boutique', 'fashion', 'apparel', 'garment', 'saree', 'tailor'], tags: [['shop', 'clothes|boutique|fashion|tailor|fabric'], ['craft', 'tailor|dressmaker']] },
  jewellery: { label: 'Jewellers', aliases: ['jewel', 'jewelry', 'jeweller', 'gold'], tags: [['shop', 'jewelry']] },
  electronics: { label: 'Electronics & Mobile Shops', aliases: ['electronics', 'mobile shop', 'phone shop', 'computer shop', 'laptop'], tags: [['shop', 'electronics|mobile_phone|computer|appliance']] },
  grocery: { label: 'Grocery & Supermarkets', aliases: ['grocery', 'supermarket', 'kirana', 'convenience store', 'general store'], tags: [['shop', 'supermarket|convenience|greengrocer|grocery']] },
  furniture: { label: 'Furniture Stores', aliases: ['furniture'], tags: [['shop', 'furniture']] },
  hardware: { label: 'Hardware Stores', aliases: ['hardware', 'paint shop', 'sanitary'], tags: [['shop', 'hardware|doityourself|paint|bathroom_furnishing']] },
  florist: { label: 'Florists', aliases: ['florist', 'flower'], tags: [['shop', 'florist']] },
  optician: { label: 'Opticians', aliases: ['optician', 'optical', 'eyewear', 'spectacle'], tags: [['shop', 'optician']] },
  photographer: { label: 'Photographers & Studios', aliases: ['photograph', 'photo studio'], tags: [['craft', 'photographer'], ['shop', 'photo']] },
  travel_agency: { label: 'Travel Agencies', aliases: ['travel agen', 'tour operator', 'travels', 'tours'], tags: [['shop', 'travel_agency'], ['office', 'travel_agent']] },
  education: { label: 'Coaching & Training Institutes', aliases: ['coaching', 'tuition', 'classes', 'institute', 'academy', 'training', 'driving school', 'music school', 'dance'], tags: [['amenity', 'driving_school|language_school|music_school|dancing_school|prep_school|training']] },
  printing: { label: 'Printing & Copy Shops', aliases: ['print', 'xerox', 'copy shop'], tags: [['shop', 'copyshop|printing'], ['craft', 'printer']] },
  laundry: { label: 'Laundry & Dry Cleaners', aliases: ['laundry', 'dry clean'], tags: [['shop', 'laundry|dry_cleaning']] },
  event: { label: 'Event & Wedding Services', aliases: ['event', 'wedding', 'caterer', 'catering', 'decorator'], tags: [['craft', 'caterer'], ['shop', 'party|wedding']] },
};

// Keys searched by name when the category is unknown. `amenity` is left out on purpose: it includes
// millions of benches, toilets and parking lots, which makes name searches over it time out.
const NAME_SEARCH_KEYS = ['shop', 'office', 'craft', 'healthcare'];

const CATEGORY_KEYS = Object.keys(CATEGORIES);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Long aliases are stems ("plumb" -> "plumbers"); short ones must be whole words so that
// "bar" doesn't match "barber" and "tax" doesn't match "taxi".
const ALIAS_MATCHERS = Object.entries(CATEGORIES).flatMap(([key, def]) =>
  def.aliases.map((alias) => ({
    key,
    length: alias.length,
    regex: new RegExp(`(?:^|\\s)${escapeRegex(alias)}${alias.length >= 5 ? '\\p{L}*' : '(?:s|es)?'}(?=\\s|$)`, 'u'),
  }))
);

const normalise = (text) => String(text || '').toLowerCase().replace(/[_\-,.]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Finds the best category for a parsed query. Tries the exact key first, then the longest alias
 * found in the category/industry text ("medical store" beats "medical"). Returns null if nothing
 * matches, in which case the caller falls back to a name search.
 */
const resolveCategory = (category, industry = '') => {
  const key = String(category || '').toLowerCase().trim();
  if (CATEGORIES[key]) return { key, ...CATEGORIES[key] };

  const text = normalise(`${category} ${industry}`);
  let best = null;
  for (const m of ALIAS_MATCHERS) {
    if ((!best || m.length > best.length) && m.regex.test(text)) best = m;
  }
  return best ? { key: best.key, ...CATEGORIES[best.key] } : null;
};

module.exports = { CATEGORIES, CATEGORY_KEYS, NAME_SEARCH_KEYS, resolveCategory };
