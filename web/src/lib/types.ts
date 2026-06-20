export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Column {
  id: number;
  name: string;
  slug: string;
  position: number;
  inferred_type: string;
  enum_values: string[] | null;
  nullable: boolean;
  sample_values: unknown[] | null;
  stats: Record<string, unknown> | null;
}

export interface Spreadsheet {
  id: number;
  name: string;
  filename: string;
  row_count: number;
  status: string;
  source_type: string;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  columns: Column[];
}

export interface SpreadsheetListItem {
  id: number;
  name: string;
  filename: string;
  row_count: number;
  status: string;
  source_type: string;
  created_at: string;
}

export interface DataRow {
  id: number;
  spreadsheet_id: number;
  row_index: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaginatedRows {
  rows: DataRow[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ChartRecommendation {
  chart_type: string;
  title: string;
  x_column: string | null;
  y_column: string | null;
  priority: number;
}
