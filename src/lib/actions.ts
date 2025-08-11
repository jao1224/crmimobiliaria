// This file uses server-side code.
'use server';

import { matchProperties as matchPropertiesFlow, type MatchPropertiesInput } from '@/ai/flows/property-matching';

// A hardcoded list of properties for the AI to use.
const MOCK_PROPERTY_DETAILS = `
1. Sunnyvale Apartment: 2 bed, 2 bath, 1200 sqft, modern kitchen, balcony, near downtown. Price: $750,000. Commission: 2.5%.
2. Greenfield House: 4 bed, 3 bath, 2500 sqft, large backyard, swimming pool, quiet neighborhood. Price: $1,200,000. Commission: 2.0%.
3. Lakeside Villa: 5 bed, 5 bath, 4000 sqft, lake view, private dock, home theater. Price: $2,500,000. Commission: 3.0%.
4. Downtown Loft: 1 bed, 1 bath, 800 sqft, open concept, exposed brick, walking distance to cafes. Price: $500,000. Commission: 2.5%.
5. Suburban Family Home: 3 bed, 2.5 bath, 2000 sqft, great school district, two-car garage. Price: $850,000. Commission: 2.2%.
6. Penthouse Condo: 3 bed, 3 bath, 2200 sqft, panoramic city views, rooftop terrace, luxury amenities. Price: $1,800,000. Commission: 2.75%.
`;

export async function findMatchingProperties(clientRequirements: string) {
  try {
    if (!clientRequirements) {
      return { success: false, error: 'Client requirements cannot be empty.' };
    }
    
    const input: MatchPropertiesInput = {
      clientRequirements,
      propertyDetails: MOCK_PROPERTY_DETAILS,
    };
    const result = await matchPropertiesFlow(input);
    return { success: true, data: result.matchingProperties };
  } catch (error) {
    console.error('Error in findMatchingProperties:', error);
    return { success: false, error: 'Failed to find matching properties due to a server error.' };
  }
}
