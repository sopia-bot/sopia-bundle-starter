import { useState, useEffect, useMemo } from 'react';
import { useEditorRef } from 'platejs/react';
import Spreadsheet from 'react-spreadsheet';
import type { Matrix } from 'react-spreadsheet';
import { type TDataTableElement, type ColumnDefinition } from '../datatable-plugin';
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
import { Plus, Trash2, Save } from 'lucide-react';
import { saveDataTable, loadUserInfo } from '@/lib/api';

interface DataTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  element: TDataTableElement;
  path: number[];
}

export function DataTableDialog({
  open,
  onOpenChange,
  element,
  path,
}: DataTableDialogProps) {
  const editor = useEditorRef();
  
  // State
  const [tableName, setTableName] = useState(element.name);
  const [columns, setColumns] = useState<ColumnDefinition[]>(element.columns);
  const [spreadsheetData, setSpreadsheetData] = useState<Matrix<{ value: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (open) {
      setTableName(element.name);
      setColumns([...element.columns]);
      
      // element.data를 spreadsheet 형식으로 변환
      const matrix: Matrix<{ value: string }> = element.data.map((row) => {
        return element.columns.map((col) => ({
          value: row[`column${col.id}`] || '',
        }));
      });
      
      setSpreadsheetData(matrix);
    }
  }, [open, element]);

  // 컬럼 추가
  const handleAddColumn = () => {
    const newId = columns.length > 0 ? Math.max(...columns.map((c) => c.id)) + 1 : 1;
    const newColumns = [...columns, { id: newId, name: `컬럼 ${newId}` }];
    setColumns(newColumns);
    
    // 기존 데이터에 빈 열 추가
    setSpreadsheetData((prev) =>
      prev.map((row) => [...row, { value: '' }])
    );
  };

  // 컬럼 삭제
  const handleDeleteColumn = (index: number) => {
    if (columns.length <= 1) {
      alert('최소 1개의 컬럼이 필요합니다.');
      return;
    }
    
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
    
    // 데이터에서도 해당 열 삭제
    setSpreadsheetData((prev) =>
      prev.map((row) => row.filter((_, i) => i !== index))
    );
  };

  // 컬럼 이름 변경
  const handleColumnNameChange = (index: number, newName: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], name: newName };
    setColumns(newColumns);
  };

  // 행 추가
  const handleAddRow = () => {
    const newRow = columns.map(() => ({ value: '' }));
    setSpreadsheetData((prev) => [...prev, newRow]);
  };

  // 행 삭제
  const handleDeleteRow = (index: number) => {
    if (spreadsheetData.length <= 1) {
      alert('최소 1개의 행이 필요합니다.');
      return;
    }
    
    setSpreadsheetData((prev) => prev.filter((_, i) => i !== index));
  };

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // spreadsheet 데이터를 API 형식으로 변환
      let data = spreadsheetData.map((row) => {
        const rowData: Record<string, string> = {};
        columns.forEach((col, index) => {
          rowData[`column${col.id}`] = row[index]?.value || '';
        });
        return rowData;
      });

      // 1. 모든 컬럼이 빈 문자열인 행 제거
      data = data.filter((row) => {
        // 모든 컬럼 값을 확인
        const allEmpty = columns.every((col) => {
          const value = row[`column${col.id}`];
          return value === '' || value === undefined || value === null;
        });
        // 비어있지 않은 행만 유지
        return !allEmpty;
      });

      // 2. userId 가져오기
      const userInfo = loadUserInfo();
      const userId = userInfo ? parseInt(userInfo.id) : undefined;

      // 3. 현재 페이지 URL 가져오기
      const pathname = window.location.pathname;
      const pageUrl = pathname.startsWith('/') ? pathname.slice(1) : pathname;

      // API 호출
      const result = await saveDataTable({
        tid: element.tid,
        name: tableName,
        columns: columns,
        data: data,
        userId: userId,
        url: pageUrl || undefined,
      });

      if (result.success) {
        // 에디터 업데이트
        editor.tf.setNodes(
          {
            name: tableName,
            columns: columns,
            data: data,
          },
          { at: path }
        );
        
        console.log('✅ DataTable 저장 완료');
        onOpenChange(false);
      } else {
        alert('저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('❌ DataTable 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Spreadsheet column labels
  const columnLabels = useMemo(
    () => columns.map((col) => col.name),
    [columns]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[90vh] max-w-[95vw] min-w-[50vw] overflow-y-auto"
        onInteractOutside={(e) => {
          // 모든 외부 클릭 방지 (backdrop 클릭 포함)
          e.preventDefault();
        }}
        onContextMenu={(e) => {
          // Dialog 내에서 platejs context menu 방지
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>데이터 테이블 편집</DialogTitle>
          <DialogDescription>
            테이블 이름, 컬럼, 데이터를 편집하고 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 테이블 이름 */}
          <div className="space-y-2">
            <Label htmlFor="table-name">테이블 이름</Label>
            <Input
              id="table-name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="예: 고객 명단, 매출 데이터"
            />
          </div>

          {/* 컬럼 설정 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>컬럼 설정</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColumn}
                className="gap-2"
              >
                <Plus className="size-4" />
                컬럼 추가
              </Button>
            </div>
            <div className="space-y-2">
              {columns.map((col, index) => (
                <div key={col.id} className="flex items-center gap-2">
                  <Input
                    value={col.name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    placeholder={`컬럼 ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteColumn(index)}
                    disabled={columns.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 데이터 편집 (Spreadsheet) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>데이터</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="gap-2"
              >
                <Plus className="size-4" />
                행 추가
              </Button>
            </div>
            <div className="rounded-md border bg-background p-4 max-h-[600px] max-w-[calc(50vw-68px)] overflow-y-auto">
              <div className="flex gap-2">
                {/* 행 삭제 버튼 */}
                <div 
                  className="flex flex-col"
                  style={{
                    paddingTop: '33px',  // 헤더 높이 (spreadsheet 헤더와 맞추기)
                    gap: '0px',          // 행 사이 간격 (spreadsheet와 맞추기)
                  }}
                >
                  {spreadsheetData.map((_, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="icon"
                      style={{
                        height: '33px',   // 행 높이 (spreadsheet 행과 맞추기)
                        minHeight: '33px',
                      }}
                      className="size-6 text-red-800"
                      onClick={() => handleDeleteRow(index)}
                      disabled={spreadsheetData.length <= 1}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  ))}
                </div>
                
                {/* Spreadsheet */}
                <div className="flex-1">
                  <Spreadsheet
                    data={spreadsheetData}
                    onChange={setSpreadsheetData}
                    columnLabels={columnLabels}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="size-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

