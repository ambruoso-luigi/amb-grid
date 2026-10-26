export type AntiqueCategory =
  | 'Orologi' | 'Audio' | 'Fotografia' | 'Scrittura'
  | 'Illuminazione' | 'Mobili' | 'Strumenti scientifici' | 'Oggetti decorativi'
  | 'Telefonia' | 'Radio' | 'Strumenti commerciali';

export type AntiqueCondition = 'Ottimo' | 'Buono' | 'Da restaurare';

export interface AntiqueImage {
  src: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

export interface AntiqueItem {
  id: number;
  code: string;
  name: string;
  category: AntiqueCategory;
  period: string;
  approximateYear: number;
  materials: string[];
  condition: AntiqueCondition;
  price: number;
  available: boolean;
  images: AntiqueImage[];
  notes: string;
}
