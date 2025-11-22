import { useState } from 'react';
import { type PlateElementProps } from 'platejs/react';
import { usePath, useElement } from 'platejs/react';
import { type TDataTableElement } from '../datatable-plugin';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from './button';
import { Input } from './input';
import { DataTableDialog } from './datatable-dialog';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

export function DataTableElement(props: PlateElementProps) {
  const path = usePath();
  const element = useElement<TDataTableElement>();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // 컬럼 정의
  const columns: ColumnDef<Record<string, string>>[] = element.columns.map((col) => ({
    accessorKey: `column${col.id}`,
    header: col.name,
    cell: ({ row }) => (
      <div className="px-2 py-1 min-w-[120px] max-w-[300px]">
        {row.getValue(`column${col.id}`)}
      </div>
    ),
  }));

  // 테이블 인스턴스
  const table = useReactTable({
    data: element.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div {...props.attributes} contentEditable={false} className="my-6">
      {props.children}
      
      <div className="rounded-lg border border-border bg-card p-6">
        {/* 헤더: 테이블 이름 + 설정 버튼 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{element.name || '데이터 테이블'}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <Settings className="size-4" />
            편집
          </Button>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <Input
            placeholder="전체 검색..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[600px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-foreground/80'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length}개 중{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            -{Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
            개 표시
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
              이전
            </Button>
            <div className="text-sm">
              {table.getState().pagination.pageIndex + 1} /{' '}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 편집 다이얼로그 */}
      <DataTableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        element={element}
        path={path}
      />
    </div>
  );
}

