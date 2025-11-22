import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type PlateElementProps, useEditorRef, usePath } from 'platejs/react';
import { useElement } from 'platejs/react';
import { type TPageLinkElement } from '../pagelink-plugin';
import { ExternalLink, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

export function PageLinkElement(props: PlateElementProps) {
  const element = useElement<TPageLinkElement>();
  const editor = useEditorRef();
  const path = usePath(); // Hook을 최상위 레벨로 이동
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [linkText, setLinkText] = useState(element.pageTitle);

  const handleSave = () => {
    // 링크 텍스트 업데이트
    editor.tf.setNodes(
      { pageTitle: linkText },
      { at: path }
    );
    setIsEditing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 페이지 이동
    navigate(`/${element.pageUrl}`);
  };

  return (
    <>
      <span
        {...props.attributes}
        contentEditable={false}
        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-sm text-blue-700 hover:bg-blue-100 cursor-pointer group"
        onClick={handleClick}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <ExternalLink className="size-3" />
        <span>{element.pageTitle || 'Untitled'}</span>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit className="size-3" />
        </button>
        {props.children}
      </span>

      {/* 링크 텍스트 편집 다이얼로그 */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>페이지 링크 편집</DialogTitle>
            <DialogDescription>
              링크 텍스트를 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">링크 텍스트</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="예: 새 프로젝트 문서"
              />
            </div>

            <div className="space-y-2">
              <Label>페이지 URL</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground font-mono">
                /{element.pageUrl}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLinkText(element.pageTitle);
                setIsEditing(false);
              }}
            >
              취소
            </Button>
            <Button type="button" onClick={handleSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

