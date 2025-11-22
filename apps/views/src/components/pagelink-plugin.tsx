import { createPlatePlugin } from 'platejs/react';

export const PAGELINK_KEY = 'pagelink';

export interface TPageLinkElement {
  type: typeof PAGELINK_KEY;
  pageUrl: string; // 페이지 URL (UUID)
  pageTitle: string; // 링크 텍스트
  children: [{ text: '' }];
  [key: string]: unknown;
}

export const PageLinkPlugin = createPlatePlugin({
  key: PAGELINK_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
});

