'use client';

import { useState, useEffect, useMemo } from 'react';
import { type PlateElementProps, PlateElement, usePath } from 'platejs/react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { type TDDayElement } from '../dday-plugin';

import './dday.css';

// ============================================================================
// Types
// ============================================================================

export type DDayStatus = 'danger' | 'warning' | 'success' | 'info';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast };
}

function getStatusByDays(days: number, isPast: boolean): DDayStatus {
  if (isPast || days <= 7) return 'danger';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'success';
  return 'info';
}

function formatDDay(days: number, isPast: boolean): string {
  if (days === 0) return 'D-Day';
  return isPast ? `D+${days}` : `D-${days}`;
}

// ============================================================================
// Main Component
// ============================================================================

export function DDayElement({
  className,
  children,
  ...props
}: PlateElementProps) {
  const { element, editor } = props;
  const path = usePath();
  
  const ddayElement = element as TDDayElement;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  const hasData = ddayElement.title && ddayElement.targetDate;

  useEffect(() => {
    if (!hasData) {
      // 데이터가 없으면 자동으로 다이얼로그 열기
      setIsDialogOpen(true);
      return;
    }

    if (ddayElement.targetDate) {
      const timer = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining(new Date(ddayElement.targetDate!)));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ddayElement.targetDate, hasData]);

  const status = useMemo(() => {
    if (!timeRemaining) return 'info';
    return getStatusByDays(timeRemaining.days, timeRemaining.isPast);
  }, [timeRemaining]);

  const ddayText = useMemo(() => {
    if (!timeRemaining) return 'D-Day';
    return formatDDay(timeRemaining.days, timeRemaining.isPast);
  }, [timeRemaining]);

  // initialData를 메모이제이션하여 불필요한 재생성 방지
  const initialFormData = useMemo(() => ({
    title: ddayElement.title || '',
    targetDate: ddayElement.targetDate ? format(new Date(ddayElement.targetDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: ddayElement.description || '',
  }), [ddayElement.title, ddayElement.targetDate, ddayElement.description]);

  const handleSetup = (data: { title: string; targetDate: string; description: string }) => {
    if (path) {
      editor.tf.setNodes(
        {
          title: data.title,
          targetDate: new Date(data.targetDate).toISOString(),
          description: data.description,
        },
        { at: path }
      );
    }
    setIsDialogOpen(false);
  };

  if (!hasData) {
    return (
      <PlateElement className="dday-container" {...props}>
        <div contentEditable={false}>
          <div className="dday-empty">
            <p className="text-muted-foreground">
              D-Day 정보를 설정하세요
            </p>
          </div>
        </div>

        <DDayDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSetup}
          initialData={initialFormData}
        />

        {children}
      </PlateElement>
    );
  }

  // D-Day 완료 여부 (오늘이거나 지난 경우)
  const isCompleted = timeRemaining && (timeRemaining.days === 0 || timeRemaining.isPast);

  return (
    <PlateElement className="dday-container" {...props}>
      <div contentEditable={false}>
        <div className={`dday-card dday-card-${status}`} onClick={() => setIsDialogOpen(true)} style={{ cursor: 'pointer' }}>
          {/* 상단: 제목 + D-Day 뱃지 */}
          <div className="dday-card-header">
            <h3 className="dday-card-title">{ddayElement.title}</h3>
            <span className={`dday-badge dday-badge-${status}`}>{ddayText}</span>
          </div>

          {/* 설명 */}
          {ddayElement.description && (
            <p className="dday-card-description">{ddayElement.description}</p>
          )}

          {timeRemaining && (
            <>
              {/* 완료 화면 */}
              {isCompleted ? (
                <div className="dday-completed-screen">
                  <div className="dday-completed-icon">
                    {timeRemaining.days === 0 ? '🎉' : '✨'}
                  </div>
                  <div className="dday-completed-title">
                    {timeRemaining.days === 0 ? 'D-Day 도달!' : 'D-Day 지남'}
                  </div>
                  <div className="dday-completed-message">
                    {timeRemaining.isPast 
                      ? `목표일로부터 ${timeRemaining.days}일이 지났습니다` 
                      : '오늘이 바로 그날입니다!'}
                  </div>
                  <div className="dday-completed-date">
                    <CalendarIcon className="size-4" />
                    <span>
                      {format(new Date(ddayElement.targetDate!), 'PPP', { locale: ko })}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* 중앙: 큰 D-Day 숫자 */}
                  <div className="dday-main-display">
                    <div className="dday-days-number tabular-nums">
                      {timeRemaining.days}
                    </div>
                    <div className="dday-days-label">일</div>
                  </div>

                  {/* 하단: 시/분/초 */}
                  <div className="dday-time-boxes">
                    <div className="dday-time-box">
                      <div className="dday-time-value tabular-nums">{timeRemaining.hours}</div>
                      <div className="dday-time-label">시</div>
                    </div>
                    <div className="dday-time-box">
                      <div className="dday-time-value tabular-nums">{timeRemaining.minutes}</div>
                      <div className="dday-time-label">분</div>
                    </div>
                    <div className="dday-time-box">
                      <div className="dday-time-value tabular-nums">{timeRemaining.seconds}</div>
                      <div className="dday-time-label">초</div>
                    </div>
                  </div>

                  {/* 최하단: 날짜 정보 */}
                  <div className="dday-card-footer">
                    <CalendarIcon className="size-4" />
                    <span>
                      {format(new Date(ddayElement.targetDate!), 'PPP', { locale: ko })}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <DDayDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSetup}
        initialData={initialFormData}
      />

      {children}
    </PlateElement>
  );
}

// ============================================================================
// Dialog Component
// ============================================================================

interface DDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; targetDate: string; description: string }) => void;
  initialData: {
    title: string;
    targetDate: string;
    description: string;
  };
}

function DDayDialog({ isOpen, onClose, onSave, initialData }: DDayDialogProps) {
  const [formData, setFormData] = useState(initialData);

  // Dialog가 열릴 때만 초기 데이터로 설정 (수정 중 초기화 방지)
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!formData.title.trim() || !formData.targetDate) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent contentEditable={false}>
        <DialogHeader>
          <DialogTitle>D-Day 설정</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="dday-title">제목 *</Label>
            <Input
              id="dday-title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="예: 수능 D-Day"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dday-description">설명</Label>
            <Textarea
              id="dday-description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="D-Day에 대한 설명을 입력하세요..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dday-target">목표 날짜 및 시간 *</Label>
            <Input
              id="dday-target"
              type="datetime-local"
              value={formData.targetDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, targetDate: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.targetDate}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
