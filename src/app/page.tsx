"use client";

import React, { useState, useEffect } from 'react';
import { Book, Dumbbell, Heart, ChevronLeft, ChevronRight, FileDown, FileUp } from 'lucide-react';

interface HabitType {
  id: 'book' | 'prayer' | 'exercise';
  name: string;
  icon: React.ElementType;
  color: string;
}

interface DayCellProps {
  monthIndex: number;
  day: number;
}

interface MonthlyStatsProps {
  monthIndex: number; 
}

interface HabitsState {
  [key: string]: Set<string>;
}

const HabitTracker: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>(0);
  const [habits, setHabits] = useState<HabitsState>({});

  useEffect(() => {
    setIsClient(true);
    setCurrentMonth(new Date().getMonth());
    
    try {
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        const converted: HabitsState = {};
        Object.keys(parsed).forEach(key => {
          converted[key] = new Set(parsed[key]);
        });
        setHabits(converted);
      }
    } catch (error) {
      console.error('Error loading habits from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (isClient && Object.keys(habits).length > 0) {
      try {
        const habitsForStorage: { [key: string]: string[] } = {};
        Object.keys(habits).forEach(key => {
          habitsForStorage[key] = Array.from(habits[key]);
        });
        localStorage.setItem('habits', JSON.stringify(habitsForStorage));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [habits, isClient]);

  const months: string[] = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const daysInMonth: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const habitTypes: HabitType[] = [
    { id: 'book', name: '50 Sayfa Kitap', icon: Book, color: 'bg-blue-500' },
    { id: 'prayer', name: '5 Vakit Namaz', icon: Heart, color: 'bg-green-500' },
    { id: 'exercise', name: '12K Spor', icon: Dumbbell, color: 'bg-orange-500' }
  ];

  const handleExport = () => {
    try {
      const habitsForExport: { [key: string]: string[] } = {};
      Object.keys(habits).forEach(key => {
        habitsForExport[key] = Array.from(habits[key]);
      });
      
      const dataStr = JSON.stringify(habitsForExport);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'habits.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Dışa aktarma işlemi başarısız oldu.');
    }
  };

  const handleImport = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              const result = e.target?.result as string;
              const parsed = JSON.parse(result);
              const converted: HabitsState = {};
              Object.keys(parsed).forEach(key => {
                converted[key] = new Set(parsed[key]);
              });
              setHabits(converted);
            } catch (error) {
              console.error('Error parsing import file:', error);
              alert('Geçersiz dosya formatı!');
            }
          };
          
          reader.readAsText(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error importing data:', error);
      alert('İçe aktarma işlemi başarısız oldu.');
    }
  };

  const toggleHabit = (monthIndex: number, day: number, habitId: string): void => {
    const key = `${monthIndex}-${day}`;
    setHabits(prev => {
      const newHabits = { ...prev };
      if (!newHabits[key]) {
        newHabits[key] = new Set();
      }
      
      const dayHabits = new Set(newHabits[key]);
      if (dayHabits.has(habitId)) {
        dayHabits.delete(habitId);
      } else {
        dayHabits.add(habitId);
      }
      
      newHabits[key] = dayHabits;
      return newHabits;
    });
  };

  const DayCell: React.FC<DayCellProps> = ({ monthIndex, day }) => {
    const key = `${monthIndex}-${day}`;
    const dayHabits = habits[key] || new Set();

    const isHabitCompleted = (habitId: string): boolean => {
      return dayHabits.has(habitId);
    };

    return (
      <div className="relative border rounded-lg overflow-hidden bg-white">
        <div className="absolute top-1 left-1 text-xs font-medium text-gray-600">{day}</div>
        <div className="flex flex-col h-16 mt-5">
          {habitTypes.map((habit) => (
            <div
              key={habit.id}
              onClick={() => toggleHabit(monthIndex, day, habit.id)}
              className={`
                flex-1 cursor-pointer transition-colors duration-200
                ${isHabitCompleted(habit.id) ? habit.color : 'bg-gray-50 hover:bg-gray-100'}
                border-b last:border-b-0 border-gray-200
              `}
            >
              {isHabitCompleted(habit.id) && (
                <div className="flex justify-center items-center h-full">
                  <habit.icon size={12} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const nextMonth = (): void => {
    setCurrentMonth((prev) => (prev + 1) % 12);
  };

  const prevMonth = (): void => {
    setCurrentMonth((prev) => (prev - 1 + 12) % 12);
  };

  const MonthlyStats: React.FC<MonthlyStatsProps> = ({ monthIndex }) => {
    const stats: { [key: string]: number } = { book: 0, prayer: 0, exercise: 0 };
    
    for (let day = 1; day <= daysInMonth[monthIndex]; day++) {
      const key = `${monthIndex}-${day}`;
      const dayHabits = habits[key] || new Set();
      habitTypes.forEach(habit => {
        if (dayHabits.has(habit.id)) {
          stats[habit.id]++;
        }
      });
    }

    return (
      <div className="grid grid-cols-3 gap-4 mt-4 print:hidden">
        {habitTypes.map(habit => (
          <div key={habit.id} className={`${habit.color} rounded-lg p-3 text-white`}>
            <div className="flex items-center gap-2">
              <habit.icon size={16} />
              <span className="text-sm font-medium">{habit.name}</span>
            </div>
            <div className="mt-2 text-lg font-bold">
              {stats[habit.id]} / {daysInMonth[monthIndex]} gün
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isClient) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Alışkanlık Takip Takvimi</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            <FileDown size={20} />
            İçe Aktar
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            <FileUp size={20} />
            Dışa Aktar
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-semibold text-gray-700">{months[currentMonth]}</h2>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="print:hidden">
        <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-lg shadow">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <div key={day} className="text-center text-xs text-gray-500 font-medium">
              {day}
            </div>
          ))}
          {[...Array(daysInMonth[currentMonth])].map((_, day) => (
            <DayCell
              key={day}
              monthIndex={currentMonth}
              day={day + 1}
            />
          ))}
        </div>
        <MonthlyStats monthIndex={currentMonth} />
      </div>

      <div className="mt-6 text-gray-600">
        <h3 className="font-semibold mb-2">Nasıl Kullanılır:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Her kutu üç bölüme ayrılmıştır:</li>
          <li><span className="text-blue-500 font-medium">Üst bölüm</span>: 50 Sayfa Kitap</li>
          <li><span className="text-green-500 font-medium">Orta bölüm</span>: 5 Vakit Namaz</li>
          <li><span className="text-orange-500 font-medium">Alt bölüm</span>: 12K Spor</li>
          <li>İlgili bölüme tıklayarak işaretleyebilir veya kaldırabilirsiniz</li>
          <li>İçe/Dışa aktar butonları ile verilerinizi yedekleyebilirsiniz</li>
        </ul>
      </div>
    </div>
  );
};

export default HabitTracker;