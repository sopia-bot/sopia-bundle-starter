import { createPlatePlugin } from 'platejs/react';

export const DATATABLE_KEY = 'datatable';

export interface ColumnDefinition {
  id: number;
  name: string;
}

export interface TDataTableElement {
  type: typeof DATATABLE_KEY;
  tid: string; // Table ID (UUID)
  name: string; // Table name
  columns: ColumnDefinition[];
  data: Record<string, string>[]; // Array of { column1: "value", column2: "value", ... }
  children: [{ text: '' }];
  [key: string]: unknown;
}

export const DataTablePlugin = createPlatePlugin({
  key: DATATABLE_KEY,
  node: {
    isElement: true,
    isVoid: true,
  },
});

