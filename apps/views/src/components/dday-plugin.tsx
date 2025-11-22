import { createPlatePlugin } from 'platejs/react';
import { type TElement } from 'platejs';

export const DDAY_KEY = 'dday';

export interface TDDayElement extends TElement {
  type: typeof DDAY_KEY;
  title?: string;
  targetDate?: string;
  description?: string;
  children: [{ text: '' }];
}

export const DDayPlugin = createPlatePlugin({
  key: DDAY_KEY,
  node: {
    isElement: true,
    isVoid: true,
  },
});

