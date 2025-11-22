'use client';

import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { Event, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PlateElement, usePath } from 'platejs/react';
import type { PlateElementProps } from 'platejs/react';
import type { TCalendarElement, CalendarEvent } from '@/components/calendar-plugin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, ChevronLeft, ChevronRight, TrashIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

// date-fns 로컬라이저 설정
const locales = {
  ko: ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// BigCalendar Event 타입 변환
interface BigCalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export function CalendarElement({
  className,
  children,
  ...props
}: PlateElementProps<TCalendarElement>) {
  const { element, editor } = props;
  const path = usePath();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(element.events || []);
  const [calendarTitle, setCalendarTitle] = useState(element.title || '캘린더');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    allDay: false,
  });

  // CalendarEvent를 BigCalendarEvent로 변환
  const bigCalendarEvents: BigCalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start),
    end: new Date(event.end),
    allDay: event.allDay,
  }));

  // 이벤트 추가
  const handleAddEvent = () => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      start: new Date(newEvent.start).toISOString(),
      end: new Date(newEvent.end).toISOString(),
      allDay: newEvent.allDay,
    };

    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    updateElementEvents(updatedEvents);
    
    setIsDialogOpen(false);
    setIsCreating(false);
    setNewEvent({
      title: '',
      description: '',
      start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      allDay: false,
    });
  };

  // 이벤트 수정
  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    
    const updatedEvents = events.map((e) =>
      e.id === selectedEvent.id ? selectedEvent : e
    );
    setEvents(updatedEvents);
    updateElementEvents(updatedEvents);
    
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  // 이벤트 삭제
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
    setEvents(updatedEvents);
    updateElementEvents(updatedEvents);
    
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  // 에디터의 element 업데이트
  const updateElementEvents = (updatedEvents: CalendarEvent[]) => {
    if (!path) return;
    editor.tf.setNodes(
      { events: updatedEvents },
      { at: path }
    );
  };

  // 타이틀 업데이트
  const updateTitle = (newTitle: string) => {
    if (!path) return;
    setCalendarTitle(newTitle);
    editor.tf.setNodes(
      { title: newTitle },
      { at: path }
    );
  };

  // 이벤트 클릭 핸들러
  const handleSelectEvent = (event: BigCalendarEvent) => {
    const originalEvent = events.find((e) => e.id === event.id);
    if (originalEvent) {
      setSelectedEvent(originalEvent);
      setIsDialogOpen(true);
      setIsCreating(false);
    }
  };

  // 슬롯 선택 (빈 공간 클릭)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setNewEvent({
      title: '',
      description: '',
      start: format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(slotInfo.end, "yyyy-MM-dd'T'HH:mm"),
      allDay: false,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  // 날짜 네비게이션 핸들러
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // 커스텀 툴바 컴포넌트
  const CustomToolbar = ({ date }: ToolbarProps<BigCalendarEvent>) => {
    const goToPrevMonth = () => {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() - 1);
      setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + 1);
      setCurrentDate(newDate);
    };

    const label = `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;

    return (
      <div className="calendar-toolbar">
        <button type="button" onClick={goToPrevMonth} className="calendar-nav-btn">
          <ChevronLeft className="size-4" />
        </button>
        <div className="calendar-toolbar-center">
          <span className="calendar-toolbar-label">{label}</span>
        </div>
        <button type="button" onClick={goToNextMonth} className="calendar-nav-btn">
          <ChevronRight className="size-4" />
        </button>
      </div>
    );
  };

  return (
    <PlateElement
      className="my-4 rounded-lg border border-border bg-background p-5 shadow-sm"
      {...(props as any)}
    >
      <div className="mb-5 flex items-center gap-2.5">
        <CalendarIcon className="size-5 text-foreground" />
        {isEditingTitle ? (
          <Input
            value={calendarTitle}
            onChange={(e) => setCalendarTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              updateTitle(calendarTitle);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                updateTitle(calendarTitle);
              }
            }}
            className="h-7 w-48 text-lg font-semibold"
            autoFocus
            contentEditable={false}
          />
        ) : (
          <h3
            className="cursor-pointer text-lg font-semibold hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
            contentEditable={false}
          >
            {calendarTitle}
          </h3>
        )}
      </div>

      <div className="h-[700px]" contentEditable={false}>
        <Calendar
          localizer={localizer}
          events={bigCalendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          views={['month']}
          defaultView="month"
          components={{
            toolbar: CustomToolbar,
          }}
          messages={{
            date: '날짜',
            time: '시간',
            event: '이벤트',
            noEventsInRange: '이 범위에 일정이 없습니다.',
            showMore: (total) => `+${total}개 더보기`,
          }}
          culture="ko"
        />
      </div>

      {/* 이벤트 추가/상세 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent contentEditable={false}>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? '새 일정 추가' : '일정 상세'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? '새로운 일정을 추가합니다.'
                : '일정 정보를 확인하거나 삭제할 수 있습니다.'}
            </DialogDescription>
          </DialogHeader>

          {isCreating ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="일정 제목"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">본문</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  placeholder="일정 내용을 입력하세요..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start">시작 시간</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">종료 시간</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="allDay"
                  type="checkbox"
                  checked={newEvent.allDay}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, allDay: e.target.checked })
                  }
                  className="size-4"
                />
                <Label htmlFor="allDay">종일</Label>
              </div>
            </div>
          ) : (
            selectedEvent && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">제목</Label>
                  <Input
                    id="edit-title"
                    value={selectedEvent.title}
                    onChange={(e) =>
                      setSelectedEvent({ ...selectedEvent, title: e.target.value })
                    }
                    placeholder="일정 제목"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">본문</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedEvent.description || ''}
                    onChange={(e) =>
                      setSelectedEvent({ ...selectedEvent, description: e.target.value })
                    }
                    placeholder="일정 내용을 입력하세요..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>시작 시간</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvent.start), 'PPP p', {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>종료 시간</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvent.end), 'PPP p', {
                      locale: ko,
                    })}
                  </p>
                </div>
                {selectedEvent.allDay && (
                  <div className="grid gap-2">
                    <Label>종일 일정</Label>
                    <p className="text-sm text-muted-foreground">예</p>
                  </div>
                )}
              </div>
            )
          )}

          <DialogFooter>
            {isCreating ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim()}
                >
                  추가
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEvent}
                >
                  <TrashIcon className="mr-2 size-4" />
                  삭제
                </Button>
                <Button onClick={handleUpdateEvent}>
                  저장
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {children}
    </PlateElement>
  );
}
