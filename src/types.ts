export interface WineData {
  wineName: string;
  vintage: string;
  region: string;
  grapeVarieties: string[];
  description: string;
  wineType: 'red' | 'white' | 'sparkling' | 'rose' | 'sweet' | 'fortified' | 'other';
  tastingNotes: {
    appearance: string;
    aroma: string;
    palate: string;
    finish: string;
  };
  vintageNotes: {
    type: 'specific' | 'general';
    year?: string;
    description: string;
  };
  rating: number;
  foodPairings: string[];
}
