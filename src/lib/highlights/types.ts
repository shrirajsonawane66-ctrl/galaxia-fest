export type Highlight = {
  id: string;
  artist_name: string;
  edition_year: number | null;
  caption: string | null;
  image_url: string;
  image_path: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HighlightInput = {
  artist_name: string;
  edition_year: number | null;
  caption: string | null;
  image_url: string;
  image_path: string;
  display_order?: number;
  is_active?: boolean;
};