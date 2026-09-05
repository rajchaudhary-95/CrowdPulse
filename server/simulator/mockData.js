/**
 * Realistic Mega-Event Seed Dataset
 * Designed for immediate visualization on Leaflet maps with real lat/lng coordinates.
 * Center: Olympic Complex Area (~ 28.5830, 77.2350)
 */

const baseDate = new Date();
// Round to top of current hour for clean simulation timeline
baseDate.setMinutes(0, 0, 0);

const mockZones = [
  {
    _id: 'zone-main-arena',
    name: 'Grand Olympic Arena Zone',
    category: 'venue_cluster',
    geoCenter: { lat: 28.5865, lng: 77.2345 },
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [28.5890, 77.2310],
        [28.5895, 77.2380],
        [28.5840, 77.2385],
        [28.5835, 77.2315],
      ],
    },
    totalCapacity: { venue: 65000, transit: 25000, hospitality: 12000 },
    liveMetrics: {
      currentVenueOccupancy: 42000,
      currentTransitPressure: 0.72,
      currentHospitalityOccupancy: 8500,
      compositeStressScore: 68,
      status: 'elevated',
      lastUpdated: new Date(),
    },
    metadata: {
      accessibilityScore: 98,
      transitConnectedZoneIds: ['zone-transit-hub', 'zone-promenade', 'zone-north-courts'],
    },
  },
  {
    _id: 'zone-transit-hub',
    name: 'Central Intermodal Transit Hub',
    category: 'transit_hub',
    geoCenter: { lat: 28.5805, lng: 77.2280 },
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [28.5825, 77.2250],
        [28.5830, 77.2310],
        [28.5780, 77.2315],
        [28.5775, 77.2255],
      ],
    },
    totalCapacity: { venue: 8000, transit: 45000, hospitality: 6000 },
    liveMetrics: {
      currentVenueOccupancy: 3200,
      currentTransitPressure: 0.86,
      currentHospitalityOccupancy: 4100,
      compositeStressScore: 78,
      status: 'warning',
      lastUpdated: new Date(),
    },
    metadata: {
      accessibilityScore: 100,
      transitConnectedZoneIds: ['zone-main-arena', 'zone-fan-park', 'zone-promenade'],
    },
  },
  {
    _id: 'zone-fan-park',
    name: 'Festival Fan Park & Live Screenings',
    category: 'venue_cluster',
    geoCenter: { lat: 28.5770, lng: 77.2370 },
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [28.5795, 77.2335],
        [28.5800, 77.2410],
        [28.5745, 77.2415],
        [28.5740, 77.2340],
      ],
    },
    totalCapacity: { venue: 35000, transit: 18000, hospitality: 15000 },
    liveMetrics: {
      currentVenueOccupancy: 12500,
      currentTransitPressure: 0.40,
      currentHospitalityOccupancy: 5000,
      compositeStressScore: 42,
      status: 'normal',
      lastUpdated: new Date(),
    },
    metadata: {
      accessibilityScore: 92,
      transitConnectedZoneIds: ['zone-transit-hub', 'zone-promenade'],
    },
  },
  {
    _id: 'zone-promenade',
    name: 'Olympic Promenade & Dining Strip',
    category: 'hospitality',
    geoCenter: { lat: 28.5820, lng: 77.2395 },
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [28.5845, 77.2365],
        [28.5850, 77.2435],
        [28.5795, 77.2440],
        [28.5790, 77.2370],
      ],
    },
    totalCapacity: { venue: 12000, transit: 15000, hospitality: 25000 },
    liveMetrics: {
      currentVenueOccupancy: 5400,
      currentTransitPressure: 0.52,
      currentHospitalityOccupancy: 14200,
      compositeStressScore: 54,
      status: 'normal',
      lastUpdated: new Date(),
    },
    metadata: {
      accessibilityScore: 96,
      transitConnectedZoneIds: ['zone-main-arena', 'zone-transit-hub', 'zone-fan-park'],
    },
  },
  {
    _id: 'zone-north-courts',
    name: 'North Aquatics & Court Pavilion',
    category: 'venue_cluster',
    geoCenter: { lat: 28.5935, lng: 77.2360 },
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [28.5960, 77.2330],
        [28.5965, 77.2395],
        [28.5910, 77.2400],
        [28.5905, 77.2335],
      ],
    },
    totalCapacity: { venue: 22000, transit: 12000, hospitality: 8000 },
    liveMetrics: {
      currentVenueOccupancy: 7800,
      currentTransitPressure: 0.44,
      currentHospitalityOccupancy: 3100,
      compositeStressScore: 45,
      status: 'normal',
      lastUpdated: new Date(),
    },
    metadata: {
      accessibilityScore: 94,
      transitConnectedZoneIds: ['zone-main-arena'],
    },
  },
];

const mockVenues = [
  {
    _id: 'venue-colosseum',
    name: 'Main Stadium 1 (Athletics)',
    zoneId: 'zone-main-arena',
    category: 'stadium',
    location: { lat: 28.5865, lng: 77.2345 },
    maxCapacity: 65000,
    currentOccupancy: 42000,
    ingressRatePerMin: 450,
    egressRatePerMin: 600,
    scheduledEvents: [
      {
        eventId: 'evt-gold-medal-finals',
        name: 'Men 100m & 4x400m Track Finals',
        startTime: new Date(baseDate.getTime() + 45 * 60 * 1000), // starts in 45m
        endTime: new Date(baseDate.getTime() + 150 * 60 * 1000),
        ticketedAttendance: 62000,
        status: 'upcoming',
      },
    ],
  },
  {
    _id: 'venue-water-center',
    name: 'Aquatics Dome',
    zoneId: 'zone-north-courts',
    category: 'stadium',
    location: { lat: 28.5935, lng: 77.2360 },
    maxCapacity: 22000,
    currentOccupancy: 7800,
    ingressRatePerMin: 200,
    egressRatePerMin: 300,
    scheduledEvents: [
      {
        eventId: 'evt-swimming-prelims',
        name: '200m Butterfly Prelims',
        startTime: new Date(baseDate.getTime() + 120 * 60 * 1000),
        endTime: new Date(baseDate.getTime() + 210 * 60 * 1000),
        ticketedAttendance: 14000,
        status: 'upcoming',
      },
    ],
  },
  {
    _id: 'venue-fan-main-stage',
    name: 'Live Megascreen Amphitheater',
    zoneId: 'zone-fan-park',
    category: 'fan_park',
    location: { lat: 28.5770, lng: 77.2370 },
    maxCapacity: 35000,
    currentOccupancy: 12500,
    ingressRatePerMin: 300,
    egressRatePerMin: 400,
    scheduledEvents: [
      {
        eventId: 'evt-concert-dj',
        name: 'Global Beats Celebration',
        startTime: new Date(baseDate.getTime() + 60 * 60 * 1000),
        endTime: new Date(baseDate.getTime() + 180 * 60 * 1000),
        ticketedAttendance: 25000,
        status: 'upcoming',
      },
    ],
  },
];

const mockTransitEdges = [
  {
    _id: 'edge-metro-line-1',
    name: 'Metro Blue Line (Transit Hub ⇄ Main Arena)',
    fromZoneId: 'zone-transit-hub',
    toZoneId: 'zone-main-arena',
    mode: 'metro',
    distanceMeters: 1200,
    baseTravelTimeMinutes: 4,
    maxThroughputPerHour: 18000,
    pathCoordinates: [
      [28.5805, 77.2280],
      [28.5835, 77.2310],
      [28.5865, 77.2345],
    ],
    liveStatus: {
      currentFlowPerHour: 15400,
      currentTravelTimeMinutes: 7,
      utilizationRate: 0.85,
      congestionLevel: 'heavy',
      isActive: true,
      shuttlesAssigned: 12,
    },
  },
  {
    _id: 'edge-shuttle-express',
    name: 'Electric Shuttle Alpha (Transit Hub ⇄ Fan Park)',
    fromZoneId: 'zone-transit-hub',
    toZoneId: 'zone-fan-park',
    mode: 'shuttle_bus',
    distanceMeters: 950,
    baseTravelTimeMinutes: 5,
    maxThroughputPerHour: 7000,
    pathCoordinates: [
      [28.5805, 77.2280],
      [28.5785, 77.2325],
      [28.5770, 77.2370],
    ],
    liveStatus: {
      currentFlowPerHour: 2800,
      currentTravelTimeMinutes: 5,
      utilizationRate: 0.40,
      congestionLevel: 'free_flow',
      isActive: true,
      shuttlesAssigned: 8,
    },
  },
  {
    _id: 'edge-pedestrian-promenade',
    name: 'Skywalk Boulevard (Main Arena ⇄ Promenade)',
    fromZoneId: 'zone-main-arena',
    toZoneId: 'zone-promenade',
    mode: 'pedestrian_walkway',
    distanceMeters: 650,
    baseTravelTimeMinutes: 8,
    maxThroughputPerHour: 12000,
    pathCoordinates: [
      [28.5865, 77.2345],
      [28.5845, 77.2370],
      [28.5820, 77.2395],
    ],
    liveStatus: {
      currentFlowPerHour: 6200,
      currentTravelTimeMinutes: 9,
      utilizationRate: 0.51,
      congestionLevel: 'moderate',
      isActive: true,
      shuttlesAssigned: 0,
    },
  },
  {
    _id: 'edge-north-connector',
    name: 'North Dedicated Transitway (Main Arena ⇄ North Courts)',
    fromZoneId: 'zone-main-arena',
    toZoneId: 'zone-north-courts',
    mode: 'shuttle_bus',
    distanceMeters: 900,
    baseTravelTimeMinutes: 4,
    maxThroughputPerHour: 6000,
    pathCoordinates: [
      [28.5865, 77.2345],
      [28.5900, 77.2355],
      [28.5935, 77.2360],
    ],
    liveStatus: {
      currentFlowPerHour: 2600,
      currentTravelTimeMinutes: 4,
      utilizationRate: 0.43,
      congestionLevel: 'free_flow',
      isActive: true,
      shuttlesAssigned: 6,
    },
  },
];

module.exports = {
  mockZones,
  mockVenues,
  mockTransitEdges,
};
