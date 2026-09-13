/**
 * Illustrative enforcement hotspots, based on publicly reported operations through 2026.
 * Not live data. Level 3 = sustained, city-wide surge; 2 = major operation or repeated activity; 1 = notable incident.
 */
export type Hotspot = {
  city: string;
  state: string;
  lat: number;
  lng: number;
  level: 1 | 2 | 3;
  when: string;
  headline: string;
  note: string;
};

export const hotspots: Hotspot[] = [
  {
    city: "Minneapolis–St. Paul", state: "MN", lat: 44.9778, lng: -93.265, level: 3, when: "Dec 2025 – Feb 2026",
    headline: "Operation Metro Surge",
    note: "A Border Patrol-led surge across the Twin Cities that expanded statewide, with roughly 3,000 arrests by mid-January 2026 and large protests.",
  },
  {
    city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, level: 3, when: "From Sep 2025",
    headline: "Operation Midway Blitz",
    note: "Hundreds of federal agents deployed across the city and suburbs, with the Broadview processing facility a focal point for arrests and protests.",
  },
  {
    city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437, level: 3, when: "From Jun 2025",
    headline: "Worksite and day-labor raids, National Guard deployment",
    note: "Sweeps at car washes, Home Depot lots, and garment workplaces set off weeks of protests and a federalized Guard deployment.",
  },
  {
    city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, level: 2, when: "Nov 2025",
    headline: "Border Patrol-led operation",
    note: "More than 700 arrests in the Charlotte area in the weeks after November 14, 2025, largely from roving patrols and traffic stops.",
  },
  {
    city: "New Orleans", state: "LA", lat: 29.9511, lng: -90.0715, level: 2, when: "Dec 2025",
    headline: "Operation Catahoula Crunch",
    note: "ICE and Border Patrol operation launched December 3, 2025 across the metro, with activity around worksites and apartment complexes.",
  },
  {
    city: "Washington", state: "DC", lat: 38.9072, lng: -77.0369, level: 2, when: "Aug 2025",
    headline: "Federal surge and Guard deployment",
    note: "Immigration arrests rose sharply during the August 2025 federal takeover of District policing, including checkpoints and traffic stops.",
  },
  {
    city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784, level: 2, when: "Oct 2025",
    headline: "ICE facility standoff",
    note: "Sustained protests at the South Portland ICE building and a contested National Guard deployment order.",
  },
  {
    city: "New York", state: "NY", lat: 40.7128, lng: -74.006, level: 2, when: "From Jun 2025",
    headline: "Courthouse arrests at 26 Federal Plaza",
    note: "People attending immigration hearings detained in hallways after cases were dismissed. Ongoing.",
  },
  {
    city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589, level: 2, when: "May – Jun 2025",
    headline: "Operation Patriot",
    note: "About 1,500 arrests across Massachusetts in a month-long operation, many during traffic stops and at homes.",
  },
  {
    city: "Ellabell / Savannah", state: "GA", lat: 32.1391, lng: -81.4917, level: 2, when: "Sep 2025",
    headline: "Hyundai–LG battery plant raid",
    note: "475 workers detained at a plant under construction, most of them South Korean nationals on work or business visas. A warning for visa holders at worksites.",
  },
  {
    city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, level: 2, when: "Ongoing",
    headline: "Largest ICE field office region",
    note: "Sustained worksite and residential operations across Harris County, with high detention volume.",
  },
  {
    city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, level: 2, when: "From Jul 2025",
    headline: "State-run detention, 287(g) sweeps",
    note: "Florida’s Everglades detention site opened in July 2025; local police act under 287(g) agreements across South Florida.",
  },
  {
    city: "El Paso", state: "TX", lat: 31.7619, lng: -106.485, level: 2, when: "From Aug 2025",
    headline: "Fort Bliss detention camp",
    note: "A large tent detention facility at Fort Bliss began holding detainees in August 2025, with expanding capacity into 2026.",
  },
  {
    city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, level: 1, when: "Sep 2025",
    headline: "Shooting at the Dallas ICE facility",
    note: "Two detainees were killed in a September 2025 attack on the field office. Enforcement operations continued in the metro.",
  },
  {
    city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, level: 1, when: "May 2025",
    headline: "Highway Patrol and ICE traffic stops",
    note: "Roughly 200 people detained in a week of joint traffic operations along South Nashville corridors.",
  },
  {
    city: "Newark", state: "NJ", lat: 40.7357, lng: -74.1724, level: 1, when: "From May 2025",
    headline: "Delaney Hall detention center",
    note: "A privately run detention center reopened amid protests and a clash involving local officials.",
  },
  {
    city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, level: 1, when: "Feb 2025",
    headline: "Apartment-complex raids",
    note: "Multi-agency raids at Aurora and Denver apartment buildings early in the administration.",
  },
  {
    city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, level: 1, when: "Ongoing",
    headline: "Arizona corridor enforcement",
    note: "Steady interior arrests and transfers through the state’s detention network.",
  },
];

export const hotspotsContext =
  "Since summer 2026 the pattern is nationwide and quieter: about 50,000 ICE arrests in August 2026 alone, with fewer visible city-by-city surges.";
