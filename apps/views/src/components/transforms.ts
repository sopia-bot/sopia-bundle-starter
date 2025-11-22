'use client';

import type { PlateEditor } from 'platejs/react';

import { insertCallout } from '@platejs/callout';
import { insertCodeBlock, toggleCodeBlock } from '@platejs/code-block';
import { insertDate } from '@platejs/date';
import { insertExcalidraw } from '@platejs/excalidraw';
import { insertColumnGroup, toggleColumnGroup } from '@platejs/layout';
import { triggerFloatingLink } from '@platejs/link/react';
import { insertEquation, insertInlineEquation } from '@platejs/math';
import { CALENDAR_KEY } from './calendar-plugin';
import { DDAY_KEY } from './dday-plugin';
import { DATATABLE_KEY } from './datatable-plugin';
import { PAGELINK_KEY } from './pagelink-plugin';
import { v4 as uuidv4 } from 'uuid';
import { savePage, loadUserInfo } from '@/lib/api';
import { normalizeNodeId } from 'platejs';
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from '@platejs/media';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { TablePlugin } from '@platejs/table/react';
import { insertToc } from '@platejs/toc';
import {
  type NodeEntry,
  type Path,
  type TElement,
  KEYS,
  PathApi,
} from 'platejs';

const ACTION_THREE_COLUMNS = 'action_three_columns';

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true }
  );
};

const insertBlockMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: (editor) =>
    insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.excalidraw]: (editor) => insertExcalidraw(editor, {}, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.img,
    }),
  [KEYS.mediaEmbed]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.table]: (editor) =>
    editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: (editor) => insertToc(editor, { select: true }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
  [CALENDAR_KEY]: (editor) => {
    const block = editor.api.block();
    if (!block) return;
    const [, path] = block;
    editor.tf.insertNodes(
      editor.api.create.block({
        type: CALENDAR_KEY,
        title: '캘린더',
        events: [],
      }),
      {
        at: PathApi.next(path),
        select: true,
      }
    );
  },
  [DDAY_KEY]: (editor) => {
    const block = editor.api.block();
    if (!block) return;
    const [, path] = block;
    editor.tf.insertNodes(
      editor.api.create.block({
        type: DDAY_KEY,
        title: '',
        targetDate: '',
        description: '',
      }),
      {
        at: PathApi.next(path),
        select: true,
      }
    );
  },
  [DATATABLE_KEY]: (editor) => {
    const block = editor.api.block();
    if (!block) return;
    const [, path] = block;
    
    // 샘플 데이터 생성
    const sampleColumns = [
      { id: 1, name: '이름' },
      { id: 2, name: '이메일' },
      { id: 3, name: '전화번호' },
    ];
    
    const sampleData = [
      { column1: '홍길동', column2: 'hong@example.com', column3: '010-1234-5678' },
      { column1: '김철수', column2: 'kim@example.com', column3: '010-2345-6789' },
      { column1: '이영희', column2: 'lee@example.com', column3: '010-3456-7890' },
    ];
    
    editor.tf.insertNodes(
      editor.api.create.block({
        type: DATATABLE_KEY,
        tid: uuidv4(), // UUID 생성
        name: '새 데이터 테이블',
        columns: sampleColumns,
        data: sampleData,
      }),
      {
        at: PathApi.next(path),
        select: true,
      }
    );
  },
};

const insertInlineMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.date]: (editor) => insertDate(editor, { select: true }),
  [KEYS.inlineEquation]: (editor) =>
    insertInlineEquation(editor, '', { select: true }),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
  [PAGELINK_KEY]: (editor) => {
    // 새 페이지 URL 생성 (UUID v4)
    const newPageUrl = uuidv4();
    
    // 페이지 링크 삽입
    editor.tf.insertNodes({
      type: PAGELINK_KEY,
      pageUrl: newPageUrl,
      pageTitle: 'Untitled',
      children: [{ text: '' }],
    });

    // 즉시 빈 페이지 저장 (404 방지)
    const userInfo = loadUserInfo();
    if (userInfo) {
      const userId = parseInt(userInfo.id);
      const emptyContent = normalizeNodeId([
        {
          type: 'p',
          children: [{ text: '' }],
        },
      ]);
      
      // 비동기로 저장 (await 없이)
      savePage(emptyContent, 'Untitled', userId, newPageUrl)
        .then(() => {
          console.log(`✅ New page created: ${newPageUrl}`);
        })
        .catch((error) => {
          console.error(`❌ Failed to create new page: ${newPageUrl}`, error);
        });
    }
  },
};

type InsertBlockOptions = {
  upsert?: boolean;
};

export const insertBlock = (
  editor: PlateEditor,
  type: string,
  options: InsertBlockOptions = {}
) => {
  const { upsert = false } = options;

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();

    if (!block) return;

    const [currentNode, path] = block;
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode);
    const currentBlockType = getBlockType(currentNode);

    const isSameBlockType = type === currentBlockType;

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return;
    }

    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type);
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      });
    }

    if (!isSameBlockType) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type);
  }
};

const setList = (
  editor: PlateEditor,
  type: string,
  entry: NodeEntry<TElement>
) => {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    }
  );
};

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [ACTION_THREE_COLUMNS]: (editor) => toggleColumnGroup(editor, { columns: 3 }),
  [KEYS.codeBlock]: (editor) => toggleCodeBlock(editor),
};

export const setBlockType = (
  editor: PlateEditor,
  type: string,
  { at }: { at?: Path } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry;

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, 'indent'], { at: path });
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry);
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path });
      }
    };

    if (at) {
      const entry = editor.api.node<TElement>(at);

      if (entry) {
        setEntry(entry);

        return;
      }
    }

    const entries = editor.api.blocks({ mode: 'lowest' });

    entries.forEach((entry) => {
      setEntry(entry);
    });
  });
};

export const getBlockType = (block: TElement) => {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol;
    }
    if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo;
    }
    return KEYS.ul;
  }

  return block.type;
};
