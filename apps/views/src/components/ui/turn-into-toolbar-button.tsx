'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getBlockType,
  setBlockType,
} from '@/components/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

export const turnIntoItems = [
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
    value: 'h1',
  },
  {
    icon: <Heading2Icon />,
    keywords: ['subtitle', 'h2', '소제목', '헤딩'],
    label: '제목 2',
    value: 'h2',
  },
  {
    icon: <Heading3Icon />,
    keywords: ['subtitle', 'h3', '소제목', '헤딩'],
    label: '제목 3',
    value: 'h3',
  },
  {
    icon: <Heading4Icon />,
    keywords: ['subtitle', 'h4', '소제목', '헤딩'],
    label: '제목 4',
    value: 'h4',
  },
  {
    icon: <Heading5Icon />,
    keywords: ['subtitle', 'h5', '소제목', '헤딩'],
    label: '제목 5',
    value: 'h5',
  },
  {
    icon: <Heading6Icon />,
    keywords: ['subtitle', 'h6', '소제목', '헤딩'],
    label: '제목 6',
    value: 'h6',
  },
  {
    icon: <ListIcon />,
    keywords: ['unordered', 'ul', '-', '글머리', '목록'],
    label: '글머리 목록',
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ['ordered', 'ol', '1', '숫자', '목록'],
    label: '번호 목록',
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ['checklist', 'task', 'checkbox', '[]', '체크', '할일'],
    label: '할 일 목록',
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ['collapsible', 'expandable', '접기', '펼치기'],
    label: '토글 목록',
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ['```', '코드'],
    label: '코드',
    value: KEYS.codeBlock,
  },
  {
    icon: <QuoteIcon />,
    keywords: ['citation', 'blockquote', '>', '인용'],
    label: '인용',
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    keywords: ['컬럼', '열'],
    label: '3단 컬럼',
    value: 'action_three_columns',
  },
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip="변환"
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="변환"
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden"
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
