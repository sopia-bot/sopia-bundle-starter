'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  CalendarIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  ExternalLink,
  TimerIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  Square,
  Table,
  TableOfContentsIcon,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import {
  insertBlock,
  insertInlineElement,
} from '@/components/transforms';
import { CALENDAR_KEY } from '@/components/calendar-plugin';
import { DDAY_KEY } from '@/components/dday-plugin';
import { DATATABLE_KEY } from '@/components/datatable-plugin';
import { PAGELINK_KEY } from '@/components/pagelink-plugin';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const groups: Group[] = [
  {
    group: '기본 블록',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph', '텍스트', '본문'],
        label: '텍스트',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1', '제목', '헤딩'],
        label: '제목 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2', '소제목', '헤딩'],
        label: '제목 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3', '소제목', '헤딩'],
        label: '제목 3',
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-', '글머리', '목록'],
        label: '글머리 목록',
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1', '숫자', '목록'],
        label: '번호 목록',
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]', '체크', '할일'],
        label: '할 일 목록',
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable', '접기', '펼치기'],
        label: '토글',
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```', '코드'],
        label: '코드 블록',
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        keywords: ['표'],
        label: '표',
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>', '인용'],
        label: '인용',
        value: KEYS.blockquote,
      },
      {
        description: '강조 블록을 삽입합니다.',
        icon: <LightbulbIcon />,
        keywords: ['note', '노트', '메모'],
        label: '콜아웃',
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: '고급 블록',
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc', '목차'],
        label: '목차',
        value: KEYS.toc,
      },
      {
        icon: <CalendarDaysIcon />,
        keywords: ['calendar', '캘린더', '일정', '스케줄'],
        label: '캘린더',
        value: CALENDAR_KEY,
      },
      {
        icon: <TimerIcon />,
        keywords: ['dday', 'D-Day', '디데이', '카운트다운', 'countdown'],
        label: 'D-Day 카운트다운',
        value: DDAY_KEY,
      },
      {
        icon: <Table />,
        keywords: ['datatable', 'data', '데이터', '테이블', '표', '스프레드시트'],
        label: '데이터 테이블',
        value: DATATABLE_KEY,
      },
      {
        icon: <Columns3Icon />,
        keywords: ['컬럼', '열'],
        label: '3단 컬럼',
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['수식'],
        label: '수식',
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        keywords: ['excalidraw', '그리기', '드로잉'],
        label: 'Excalidraw',
        value: KEYS.excalidraw,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: '인라인',
    items: [
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ['time', '날짜', '시간'],
        label: '날짜',
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['수식'],
        label: '인라인 수식',
        value: KEYS.inlineEquation,
      },
      {
        focusEditor: false,
        icon: <ExternalLink />,
        keywords: ['페이지', 'page', '링크', 'link'],
        label: '페이지',
        value: PAGELINK_KEY,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>검색 결과 없음</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
