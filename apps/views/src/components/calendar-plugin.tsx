import { createPlatePlugin } from 'platejs/react';

export const CALENDAR_KEY = 'calendar';

export interface TCalendarElement {
  type: typeof CALENDAR_KEY;
  title?: string;
  events?: CalendarEvent[];
  children: [{ text: '' }];
  [key: string]: unknown;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay?: boolean;
}

export const CalendarPlugin = createPlatePlugin({
  key: CALENDAR_KEY,
  node: {
    isElement: true,
    isVoid: true,
  },
});

