export interface WineData {
  wineName: string;
  vintage: string;
  region: string;
  countryCode: string;
  mapSearchQuery: string;
  estimatedPriceHKD: string;
  grapeVarieties: string[];
  description: string;
  wineType: 'red' | 'white' | 'sparkling' | 'champagne' | 'rose' | 'sweet' | 'fortified' | 'other';
  tastingNotes: {
    appearance: string;
    aroma: string;
    palate: string;
    finish: string;
  };
  analysis: {
    acidity: number;
    sweetness: number;
    body: number;
    complexity: number;
    balance: number;
  };
  vintageNotes: {
    type: 'specific' | 'general';
    year?: string;
    description: string;
  };
  rating: number;
  foodPairings: string[];
  decantingTime: string;
}
