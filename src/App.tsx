import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, X, GripVertical, Edit2, Trash2 } from 'lucide-react';
import styled, { css } from 'styled-components';

// Interfaces
interface Task {
  id: string;
  text: string;
  color: string;
  createdAt: Date;
}

interface HolidayData {  // Changed from 'Holiday' to fix redeclare error
  date: string;
  name: string;
}

interface DragState {
  task: Task | null;
  from: { dateKey: string; index: number } | null;
  isDragging: boolean;
}

interface DayCellProps {
  $isOtherMonth?: boolean;
  $isToday?: boolean;
  $isDragOver?: boolean;
}

interface TaskProps {
  $color?: string;
  $isDragging?: boolean;
  $isHovered?: boolean;
}

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const CalendarCard = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #ff8c00 0%, #ffd700 100%);
  padding: 20px 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.div`
  color: #fecaca;
  font-size: 13px;
  background: rgba(239, 68, 68, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

const LoadingMessage = styled.div`
  color: white;
  font-size: 13px;
  opacity: 0.9;
`;

const MonthNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
`;

const MonthTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  min-width: 200px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 40px 10px 16px;
  color: #1f2937;
  font-size: 14px;
  width: 250px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    outline: none;
    border-color: #ff8c00;
    box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
  }
`;

const SearchIconStyled = styled(Search)`
  position: absolute;
  right: 12px;
  width: 16px;
  height: 16px;
  color: #9ca3af;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 35px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    color: #6b7280;
    background: #f3f4f6;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
  padding: 16px;
`;

const DayHeader = styled.div`
  background: #f9fafb;
  padding: 16px 8px;
  text-align: center;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 6px 6px 0 0;
`;

const DayCellStyled = styled.div<DayCellProps>`
  background: white;
  min-height: 140px;
  padding: 8px;
  position: relative;
  transition: all 0.2s ease;
  
  ${props => props.$isOtherMonth && css`
    background: #f8fafc;
    color: #9ca3af;
  `}
  
  ${props => props.$isToday && css`
    box-shadow: inset 0 0 0 2px #ff8c00;
    background: #fff7ed;
  `}
  
  ${props => props.$isDragOver && css`
    background: #eff6ff;
    box-shadow: inset 0 0 0 2px #3b82f6;
  `}
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DayNumber = styled.div<{ $isOtherMonth?: boolean; $isToday?: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$isOtherMonth ? '#9ca3af' : '#1f2937'};
  
  ${props => props.$isToday && css`
    background: #ff8c00;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  `}
`;

const Holiday = styled.div`
  font-size: 11px;
  color: #dc2626;
  margin-top: 24px;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 500;
  background: #fef2f2;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

const TasksContainer = styled.div`
  margin-top: ${props => props.className?.includes('has-holiday') ? '4px' : '24px'};
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 60px;
`;

const TaskStyled = styled.div<TaskProps>`
  background: white;
  border-left: 4px solid ${props => props.$color || '#10b981'};
  color: #1f2937;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.$isDragging && css`
    opacity: 0.5;
    transform: rotate(2deg) scale(1.05);
    z-index: 1000;
  `}
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
`;

const DragHandle = styled(GripVertical)`
  width: 12px;
  height: 12px;
  color: #9ca3af;
  flex-shrink: 0;
`;

const TaskText = styled.span`
  flex: 1;
  font-weight: 500;
  color: #1f2937;
`;

const TaskActions = styled.div<{ $isVisible: boolean }>`
  display: flex;
  gap: 4px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  color: ${props => props.$variant === 'delete' ? '#dc2626' : '#3b82f6'};
  
  &:hover {
    background: ${props => props.$variant === 'delete' ? '#fef2f2' : '#eff6ff'};
  }
`;

const TaskInput = styled.input`
  background: white;
  border: 2px solid #ff8c00;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  width: 100%;
  font-weight: 500;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
  }
`;

const AddButton = styled.button`
  background: none;
  border: 2px dashed #d1d5db;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
`;

const taskColors = [
  '#10b981', // green
  '#3b82f6', // blue  
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// Task Item Component
interface TaskItemProps {
  task: Task;
  index: number;
  dateKey: string;
  isEditing: boolean;
  isDragging: boolean;
  onEditStart: (id: string | null) => void;
  onEditSave: (dateKey: string, taskId: string, text: string) => void;
  onDelete: (dateKey: string, taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task, dateKey: string, index: number) => void;
  onDragEnd: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  dateKey,
  isEditing,
  isDragging,
  onEditStart,
  onEditSave,
  onDelete,
  onDragStart,
  onDragEnd,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      onEditSave(dateKey, task.id, target.value);
      onEditStart(null);
    }
    if (e.key === 'Escape') {
      onEditStart(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onEditSave(dateKey, task.id, e.target.value);
    onEditStart(null);
  };

  if (isEditing) {
    return (
      <TaskInput
        ref={inputRef}
        defaultValue={task.text}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <TaskStyled
      $color={task.color}
      $isDragging={isDragging}
      draggable
      data-task-id={task.id}
      onDragStart={(e) => onDragStart(e, task, dateKey, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DragHandle />
      <TaskText>{task.text}</TaskText>
      <TaskActions $isVisible={isHovered}>
        <ActionButton
          $variant="edit"
          onClick={() => onEditStart(`${dateKey}-${task.id}`)}
          title="Edit task"
        >
          <Edit2 size={12} />
        </ActionButton>
        <ActionButton
          $variant="delete"
          onClick={() => onDelete(dateKey, task.id)}
          title="Delete task"
        >
          <Trash2 size={12} />
        </ActionButton>
      </TaskActions>
    </TaskStyled>
  );
};

// Main Component
const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    task: null,
    from: null,
    isDragging: false
  });
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [holidayError, setHolidayError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Memoized calendar dates calculation
  const getCalendarDates = useCallback((): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const dates: Date[] = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [currentDate]);

  const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => date.getMonth() === currentDate.getMonth();

  // Fetch holidays with better error handling
  useEffect(() => {
    const fetchHolidays = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const year = currentDate.getFullYear();
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
        if (response.ok) {
          const holidayData: HolidayData[] = await response.json();
          const holidayMap: Record<string, string> = {};
          holidayData.forEach(holiday => {
            holidayMap[holiday.date] = holiday.name;
          });
          setHolidays(holidayMap);
          setHolidayError(false);
        } else {
          throw new Error('Failed to fetch holidays');
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
        setHolidayError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHolidays();
  }, [currentDate]);

  const goToPreviousMonth = (): void => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = (): void => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const addTask = (dateKey: string, taskText: string): void => {
    if (!taskText.trim()) return;
    const newTask: Task = {
      id: `${Date.now()}-${Math.random()}`,
      text: taskText.trim(),
      color: taskColors[Math.floor(Math.random() * taskColors.length)],
      createdAt: new Date(),
    };
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newTask],
    }));
  };

  const editTask = (dateKey: string, taskId: string, newText: string): void => {
    if (!newText.trim()) {
      deleteTask(dateKey, taskId);
      return;
    }
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(task =>
        task.id === taskId ? { ...task, text: newText.trim() } : task
      ),
    }));
  };

  const deleteTask = (dateKey: string, taskId: string): void => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(task => task.id !== taskId),
    }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task, dateKey: string, index: number): void => {
    setDragState({
      task,
      from: { dateKey, index },
      isDragging: true
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
  };

  const handleDragEnd = (): void => {
    setDragState({
      task: null,
      from: null,
      isDragging: false
    });
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dateKey = e.currentTarget.dataset.dateKey;
    if (dateKey && dateKey !== dragOverCell) {
      setDragOverCell(dateKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCell(null);
    }
  };

  const getInsertionIndex = (container: HTMLElement, clientY: number): number => {
    const taskElements = Array.from(container.querySelectorAll('[data-task-id]')) as HTMLElement[];
    let index = 0;
    
    for (const element of taskElements) {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2 - containerRect.top;
      const mouseY = clientY - containerRect.top;
      
      if (mouseY < elementCenter) {
        break;
      }
      index++;
    }
    
    return index;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    
    if (!dragState.task || !dragState.from) return;
    
    const targetDateKey = e.currentTarget.dataset.dateKey || '';
    const tasksContainer = e.currentTarget.querySelector('[data-tasks-container]') as HTMLElement;
    
    if (!tasksContainer) return;
    
    const insertionIndex = getInsertionIndex(tasksContainer, e.clientY);
    
    setTasks(prev => {
      const newTasks = { ...prev };
      const { task, from } = dragState;
      
      // Add null check to fix TypeScript error
      if (!from) return prev;
      
      // Remove from original position
      newTasks[from.dateKey] = newTasks[from.dateKey].filter((_, i) => i !== from.index);
      
      // Add to new position
      if (!newTasks[targetDateKey]) newTasks[targetDateKey] = [];
      
      // Adjust insertion index if moving within the same day
      let adjustedIndex = insertionIndex;
      if (from.dateKey === targetDateKey && from.index < insertionIndex) {
        adjustedIndex = insertionIndex - 1;
      }
      
      newTasks[targetDateKey] = [
        ...newTasks[targetDateKey].slice(0, adjustedIndex),
        task,
        ...newTasks[targetDateKey].slice(adjustedIndex)
      ] as Task[];
      
      return newTasks;
    });
    
    handleDragEnd();
  };

  const filterTasks = (tasksForDay: Task[]): Task[] => {
    if (!searchTerm) return tasksForDay;
    return tasksForDay.filter(task => 
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const calendarDates = getCalendarDates();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClear = (): void => {
    setSearchTerm('');
  };

  const handleNewTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, dateKey: string): void => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      addTask(dateKey, target.value);
      setEditingTask(null);
    }
    if (e.key === 'Escape') {
      setEditingTask(null);
    }
  };

  const handleNewTaskBlur = (e: React.FocusEvent<HTMLInputElement>, dateKey: string): void => {
    if (e.target.value.trim()) {
      addTask(dateKey, e.target.value);
    }
    setEditingTask(null);
  };

  return (
    <AppContainer>
      <CalendarCard>
        <Header>
          <HeaderLeft>
            <Title>
              <Calendar size={28} />
              Task Calendar
            </Title>
            {holidayError && <ErrorMessage>Failed to load holidays</ErrorMessage>}
            {isLoading && <LoadingMessage>Loading holidays...</LoadingMessage>}
          </HeaderLeft>
          
          <MonthNavigation>
            <NavButton onClick={goToPreviousMonth} aria-label="Previous month">
              <ChevronLeft size={20} />
            </NavButton>
            <MonthTitle>{monthName}</MonthTitle>
            <NavButton onClick={goToNextMonth} aria-label="Next month">
              <ChevronRight size={20} />
            </NavButton>
          </MonthNavigation>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search tasks"
            />
            {searchTerm && (
              <ClearButton onClick={handleSearchClear} aria-label="Clear search">
                <X size={16} />
              </ClearButton>
            )}
            <SearchIconStyled />
          </SearchContainer>
        </Header>

        <CalendarGrid>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <DayHeader key={day}>{day.slice(0, 3)}</DayHeader>
          ))}
          
          {calendarDates.map((date, index) => {
            const dateKey = formatDateKey(date);
            const dayTasks = tasks[dateKey] || [];
            const filteredTasksForDay = filterTasks(dayTasks);
            const holiday = holidays[dateKey];
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDay = isToday(date);
            const isDragOverDay = dragOverCell === dateKey;
            
            return (
              <DayCellStyled
                key={index}
                $isOtherMonth={!isCurrentMonthDay}
                $isToday={isTodayDay}
                $isDragOver={isDragOverDay}
                data-date-key={dateKey}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <DayNumber $isOtherMonth={!isCurrentMonthDay} $isToday={isTodayDay}>
                  {date.getDate()}
                </DayNumber>
                
                {holiday && <Holiday>{holiday}</Holiday>}
                
                <TasksContainer 
                  data-tasks-container
                  className={holiday ? 'has-holiday' : ''}
                >
                  {filteredTasksForDay.map((task, taskIndex) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      index={taskIndex}
                      dateKey={dateKey}
                      isEditing={editingTask === `${dateKey}-${task.id}`}
                      isDragging={dragState.isDragging && dragState.task?.id === task.id}
                      onEditStart={setEditingTask}
                      onEditSave={editTask}
                      onDelete={deleteTask}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  
                  {editingTask === `new-${dateKey}` ? (
                    <TaskInput
                      placeholder="Enter task..."
                      onBlur={(e) => handleNewTaskBlur(e, dateKey)}
                      onKeyDown={(e) => handleNewTaskKeyDown(e, dateKey)}
                      autoFocus
                    />
                  ) : (
                    <AddButton onClick={() => setEditingTask(`new-${dateKey}`)}>
                      <Plus size={12} />
                      Add task
                    </AddButton>
                  )}
                </TasksContainer>
              </DayCellStyled>
            );
          })}
        </CalendarGrid>
      </CalendarCard>
    </AppContainer>
  );
};

export default CalendarApp;