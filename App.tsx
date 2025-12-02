import React, { useState, useMemo } from 'react';
import { 
  Activity, Calendar, Plus,
  ChevronRight, ChevronLeft, CheckCircle2,
  Pencil, Trash2, XCircle,
  Save, Target, Timer
} from 'lucide-react';
import { WheelPicker } from './components/WheelPicker';
import { Goal, Record, Shoe, PickerState } from './types';

// --- Utility Functions ---
const getFormattedDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateRange = (start: number, end: number, step = 1) => {
  const arr = [];
  for (let i = start; i <= end; i += step) arr.push(i);
  return arr;
};

const parseTimeStr = (str: string) => {
  if (!str) return { min: 0, sec: 0 };
  const parts = str.split(':');
  return { min: parseInt(parts[0]) || 0, sec: parseInt(parts[1]) || 0 };
};

const parseDistNum = (num: string | number) => {
  if (!num && num !== 0) return 0;
  return Math.floor(typeof num === 'string' ? parseFloat(num) : num); 
};

// --- Custom Icons ---
const ShoeIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 18h18a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z" />
    <path d="M3.5 18l.8-4.5a2 2 0 0 1 2-1.6h.4a2 2 0 0 0 1.9-1.4l.6-2.1a2 2 0 0 1 1.9-1.5h1.2a2 2 0 0 1 1.9 1.5l1.1 4a2 2 0 0 0 1.9 1.5h3.4" />
  </svg>
);

// Explicitly typed as React.FC to handle 'key' and 'children' props correctly in TypeScript
const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-700 ${className} ${onClick ? 'cursor-pointer hover:border-slate-500 transition-colors' : ''}`}>
    {children}
  </div>
);

const SHOE_COLORS = [
  { label: 'Orange', value: 'bg-orange-500' },
  { label: 'Lime', value: 'bg-lime-400' },
  { label: 'Emerald', value: 'bg-emerald-500' },
  { label: 'Sky', value: 'bg-sky-500' },
  { label: 'Purple', value: 'bg-purple-500' },
  { label: 'Rose', value: 'bg-rose-500' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('goals');
  
  // --- Data State ---
  const [shoes, setShoes] = useState<Shoe[]>([
    { id: 1, name: 'Nike Vaporfly 3', brand: 'Nike', mileage: 120, maxMileage: 600, color: 'bg-orange-500' },
    { id: 2, name: 'Adidas Adios Pro 3', brand: 'Adidas', mileage: 45, maxMileage: 700, color: 'bg-lime-400' },
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, date: '2023-11-20', targetDist: 10, targetPace: '5:00', type: 'distance', achieved: true },
    { id: 2, date: '2023-11-22', targetDist: 5, targetPace: '4:30', type: 'distance', achieved: false },
  ]);

  const [records, setRecords] = useState<Record[]>([
    { id: 1, date: '2023-11-20', distance: 10, time: '51:00', pace: '5:00', avgHr: 155, maxHr: 172, cadence: 180, shoeId: 1 }
  ]);

  // --- View State ---
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); 
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'log' | 'edit'>('view');
  const [goalType, setGoalType] = useState<'distance' | 'interval'>('distance');

  const [pickerState, setPickerState] = useState<PickerState>({
    targetDistInt: 0, targetPaceMin: 5, targetPaceSec: 30,
    intervalSets: 5, intervalWorkDist: 400, intervalRestTime: 90,
    actualDistInt: 0, actualTimeMin: 0, actualTimeSec: 0,
    shoeId: '', isComplete: false
  });

  // --- Shoe Management State ---
  const [shoeModalOpen, setShoeModalOpen] = useState(false);
  const [editingShoe, setEditingShoe] = useState<Shoe | null>(null);
  const [shoeForm, setShoeForm] = useState({ name: '', brand: '', mileage: 0, maxMileage: 600, color: 'bg-orange-500' });

  // --- Memos ---
  const periodStats = useMemo(() => {
    let startDate: Date, endDate: Date;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    }

    const sStr = getFormattedDate(startDate);
    const eStr = getFormattedDate(endDate);

    let totalTarget = 0;
    let totalActual = 0;

    goals.forEach(g => { if (g.date >= sStr && g.date <= eStr) totalTarget += parseFloat(String(g.targetDist || 0)); });
    records.forEach(r => { if (r.date >= sStr && r.date <= eStr) totalActual += parseFloat(String(r.distance || 0)); });

    return { actual: Math.floor(totalActual), target: Math.floor(totalTarget) };
  }, [viewMode, currentDate, goals, records]);

  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayStr = getFormattedDate(new Date());

    if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = getFormattedDate(d);
        days.push({ 
          date: d, dateStr, 
          isToday: dateStr === todayStr,
          hasGoal: goals.some(g => g.date === dateStr),
          hasRecord: records.some(r => r.date === dateStr)
        });
      }
    } else {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDay();
      for (let i = 0; i < startDay; i++) days.push(null); 
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        const dateStr = getFormattedDate(d);
        days.push({
          date: d, dateStr,
          isToday: dateStr === todayStr,
          hasGoal: goals.some(g => g.date === dateStr),
          hasRecord: records.some(r => r.date === dateStr)
        });
      }
    }
    return days;
  }, [currentDate, viewMode, goals, records]);

  // --- Shoe Handlers ---
  const handleOpenShoeModal = (shoe?: Shoe) => {
    if (shoe) {
      setEditingShoe(shoe);
      setShoeForm({ ...shoe });
    } else {
      setEditingShoe(null);
      setShoeForm({ name: '', brand: '', mileage: 0, maxMileage: 600, color: 'bg-orange-500' });
    }
    setShoeModalOpen(true);
  };

  const handleSaveShoe = () => {
    if (!shoeForm.name || !shoeForm.brand) {
      alert("브랜드와 모델명을 입력해주세요.");
      return;
    }
    
    if (editingShoe) {
      setShoes(shoes.map(s => s.id === editingShoe.id ? { ...shoeForm, id: s.id } : s));
    } else {
      const newShoe = { ...shoeForm, id: Date.now() };
      setShoes([...shoes, newShoe]);
    }
    setShoeModalOpen(false);
  };

  const handleDeleteShoe = () => {
    if (!editingShoe) return;
    if (window.confirm("이 러닝화를 삭제하시겠습니까?")) {
        setShoes(shoes.filter(s => s.id !== editingShoe.id));
        setShoeModalOpen(false);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const goal = goals.find(g => g.date === dateStr);
    const record = records.find(r => r.date === dateStr);
    
    let mode: any = 'view';
    if (!goal) mode = 'create';
    else if (goal && !record) mode = 'log';
    else mode = 'view';
    setModalMode(mode);
    setGoalType(goal?.type || 'distance');

    const targetDist = parseDistNum(goal ? goal.targetDist : 5);
    const targetPace = parseTimeStr(goal ? goal.targetPace : "5:30");
    const iSets = goal?.intervalDetails?.sets || 5;
    const iWork = goal?.intervalDetails?.workDist || 400;
    const iRest = goal?.intervalDetails?.restTime || 90;

    let actualDist = 0;
    let actualTime = { min: 0, sec: 0 };

    if (record) {
      actualDist = parseDistNum(record.distance);
      actualTime = parseTimeStr(record.time);
    } else if (goal) {
      actualDist = targetDist;
      let totalSeconds = 0;
      if (goal.type === 'interval') {
         const workSec = (iWork / 1000) * 240; 
         totalSeconds = (workSec + iRest) * iSets;
      } else {
         totalSeconds = actualDist * (targetPace.min * 60 + targetPace.sec);
      }
      actualTime = { min: Math.floor(totalSeconds / 60), sec: Math.floor(totalSeconds % 60) };
    }

    setPickerState({
      targetDistInt: targetDist, targetPaceMin: targetPace.min, targetPaceSec: targetPace.sec,
      intervalSets: iSets, intervalWorkDist: iWork, intervalRestTime: iRest,
      actualDistInt: actualDist, actualTimeMin: actualTime.min, actualTimeSec: actualTime.sec,
      shoeId: record ? String(record.shoeId) : '', isComplete: goal ? goal.achieved : false
    });
  };

  const handleSaveGoal = () => {
    if (!selectedDate) return;
    let targetDistVal = 0;
    let intervalDetails = null;
    if (goalType === 'interval') {
        targetDistVal = (pickerState.intervalSets * pickerState.intervalWorkDist) / 1000;
        intervalDetails = { sets: pickerState.intervalSets, workDist: pickerState.intervalWorkDist, restTime: pickerState.intervalRestTime };
    } else {
        targetDistVal = pickerState.targetDistInt;
    }
    const targetPaceVal = `${pickerState.targetPaceMin}:${pickerState.targetPaceSec.toString().padStart(2, '0')}`;
    const newGoal: Goal = { 
      id: Date.now(), 
      date: selectedDate, 
      type: goalType, 
      targetDist: targetDistVal, 
      targetPace: targetPaceVal, 
      intervalDetails: intervalDetails, 
      achieved: false 
    };
    setGoals([...goals, newGoal]);
    setSelectedDate(null);
  };

  const handleDeleteGoal = () => {
    if(window.confirm("목표를 삭제하시겠습니까?")) {
      setGoals(goals.filter(g => g.date !== selectedDate));
      setSelectedDate(null);
    }
  };

  const handleComplete = (isSuccess: boolean) => {
    if (!selectedDate) return;
    setGoals(goals.map(g => g.date === selectedDate ? { ...g, achieved: isSuccess } : g));
    const recordIndex = records.findIndex(r => r.date === selectedDate);

    if (isSuccess) {
        const actualDistVal = pickerState.actualDistInt;
        const actualTimeVal = `${pickerState.actualTimeMin}:${pickerState.actualTimeSec.toString().padStart(2, '0')}`;
        if (actualDistVal <= 0) { alert("거리를 입력해주세요."); return; }

        let calculatedPace = "0:00";
        if (actualDistVal > 0) {
            const totalSec = pickerState.actualTimeMin * 60 + pickerState.actualTimeSec;
            const paceSecTotal = totalSec / actualDistVal;
            calculatedPace = `${Math.floor(paceSecTotal / 60)}:${Math.floor(paceSecTotal % 60).toString().padStart(2, '0')}`;
        }
        let distanceDelta = actualDistVal;
        if (recordIndex >= 0) distanceDelta = actualDistVal - records[recordIndex].distance;

        const newRecord: Record = {
            id: recordIndex >= 0 ? records[recordIndex].id : Date.now(),
            date: selectedDate, distance: actualDistVal, time: actualTimeVal, pace: calculatedPace,
            shoeId: pickerState.shoeId ? parseInt(pickerState.shoeId) : undefined, 
            avgHr: recordIndex >= 0 ? records[recordIndex].avgHr : null,
            maxHr: recordIndex >= 0 ? records[recordIndex].maxHr : null, 
            cadence: recordIndex >= 0 ? records[recordIndex].cadence : null,
        };

        if (recordIndex >= 0) {
            const updatedRecords = [...records];
            updatedRecords[recordIndex] = newRecord;
            setRecords(updatedRecords);
            if (pickerState.shoeId && records[recordIndex].shoeId === parseInt(pickerState.shoeId)) {
                setShoes(shoes.map(shoe => shoe.id === parseInt(pickerState.shoeId) ? { ...shoe, mileage: Math.max(0, shoe.mileage + distanceDelta) } : shoe));
            }
        } else {
            setRecords([...records, newRecord]);
            if (pickerState.shoeId) {
                setShoes(shoes.map(shoe => shoe.id === parseInt(pickerState.shoeId) ? { ...shoe, mileage: shoe.mileage + actualDistVal } : shoe));
            }
        }
    } else {
        if (recordIndex >= 0) {
            const recordToDelete = records[recordIndex];
            if (recordToDelete.shoeId) {
                setShoes(shoes.map(shoe => shoe.id === Number(recordToDelete.shoeId) ? { ...shoe, mileage: Math.max(0, shoe.mileage - recordToDelete.distance) } : shoe));
            }
            setRecords(records.filter(r => r.id !== recordToDelete.id));
        }
    }
    setSelectedDate(null);
  };

  const handleDeleteRecord = () => {
    if(window.confirm("기록을 삭제하시겠습니까?")) { handleComplete(false); }
  };

  const [recordForm, setRecordForm] = useState({ date: getFormattedDate(new Date()), distance: '', time: '', shoeId: '' });
  const handleAddRecord = (e: React.FormEvent) => { 
    e.preventDefault();
    if (!recordForm.distance || !recordForm.date) return;
    const dist = parseFloat(recordForm.distance);
    const newRecord: Record = { 
        id: Date.now(), 
        date: recordForm.date, 
        distance: dist, 
        time: '00:00', // Default for quick add
        pace: '0:00',
        shoeId: recordForm.shoeId ? parseInt(recordForm.shoeId) : undefined
    };
    setRecords([newRecord, ...records]);
    if (recordForm.shoeId) setShoes(shoes.map(shoe => shoe.id === parseInt(recordForm.shoeId) ? { ...shoe, mileage: shoe.mileage + dist } : shoe));
    const targetGoal = goals.find(g => g.date === recordForm.date);
    if (targetGoal && dist >= targetGoal.targetDist) setGoals(goals.map(g => g.id === targetGoal.id ? { ...g, achieved: true } : g));
    setRecordForm({ ...recordForm, distance: '', time: ''});
    setActiveTab('goals');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-lime-500 selection:text-slate-900">
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2"><span className="text-lime-400">RUN</span>PRO</h1>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600"></div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6">
        {/* --- GOALS TAB --- */}
        {activeTab === 'goals' && (
          <div className="animate-fade-in space-y-6 relative">
            <div className="flex flex-col items-center justify-center py-4 bg-slate-900/50 rounded-2xl border border-slate-800 mb-2">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">{viewMode === 'week' ? 'THIS WEEK' : 'THIS MONTH'}</div>
                <div className="text-5xl font-black text-white italic tracking-tighter flex items-baseline gap-2">
                    <span className="text-lime-400">{periodStats.actual}</span>
                    <span className="text-slate-600 text-3xl not-italic font-normal">/</span>
                    <span className="text-slate-500 text-3xl">{periodStats.target}</span>
                    <span className="text-sm text-slate-600 font-normal not-italic ml-1">km</span>
                </div>
            </div>

            <div className="flex justify-between items-center mb-2 px-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{currentDate.getMonth() + 1}월</h2>
                <div className="flex bg-slate-800 rounded-lg p-1 ml-2">
                  <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'week' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>주간</button>
                  <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'month' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>월간</button>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { const d = new Date(currentDate); viewMode === 'week' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1); setCurrentDate(d); }} className="p-1.5 bg-slate-800 rounded-full hover:bg-slate-700"><ChevronLeft size={16} /></button>
                <button onClick={() => { const d = new Date(currentDate); viewMode === 'week' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1); setCurrentDate(d); }} className="p-1.5 bg-slate-800 rounded-full hover:bg-slate-700"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
              {['일', '월', '화', '수', '목', '금', '토'].map(d => (<div key={d} className="text-center text-xs text-slate-500 py-2">{d}</div>))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square"></div>;
                const dayGoal = goals.find(g => g.date === day.dateStr);
                const dayRecord = records.find(r => r.date === day.dateStr);
                return (
                  <div key={idx} onClick={() => handleDateClick(day.dateStr)} className={`
                    ${viewMode === 'week' ? 'min-h-[80px] py-2' : 'aspect-square'} rounded-xl flex flex-col items-center ${viewMode === 'week' ? 'justify-start gap-1' : 'justify-center'} cursor-pointer transition-all border 
                    ${day.isToday ? 'bg-lime-500/10 border-lime-500 text-lime-400' : 'bg-slate-800 border-slate-800 hover:border-slate-600'} ${(day.hasGoal || day.hasRecord) && viewMode !== 'week' ? 'ring-1 ring-white/20' : ''}`}>
                    <span className={`text-sm font-bold ${day.isToday ? 'text-lime-400' : 'text-white'}`}>{day.date.getDate()}</span>
                    {viewMode === 'week' ? (
                        <>
                            {dayGoal ? (
                                <div className="flex flex-col items-center gap-0.5 w-full">
                                    <div className="flex flex-col items-center bg-indigo-900/30 rounded px-1 py-0.5 w-full max-w-[48px]">
                                        {dayGoal.type === 'interval' ? <span className="text-[8px] text-indigo-300 font-bold leading-none">INTV</span> : <span className="text-[9px] text-indigo-300 font-bold leading-none">{dayGoal.targetDist}km</span>}
                                        <span className="text-[8px] text-indigo-400 leading-none mt-0.5">{dayGoal.targetPace}</span>
                                    </div>
                                    {dayRecord && (
                                        <div className="flex flex-col items-center bg-emerald-900/30 rounded px-1 py-0.5 w-full max-w-[48px] mt-0.5">
                                            <span className="text-[9px] text-emerald-300 font-bold leading-none">{dayRecord.distance}km</span>
                                            <span className="text-[8px] text-emerald-400 leading-none mt-0.5">{dayRecord.pace}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (<div className="mt-2 text-slate-600"><Plus size={14}/></div>)}
                        </>
                    ) : (
                        <>
                            {!day.hasGoal && !day.hasRecord && <div className="mt-1 text-slate-600"><Plus size={12}/></div>}
                            {(day.hasGoal || day.hasRecord) && <div className="flex gap-1 mt-1 h-2">{day.hasGoal && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>}{day.hasRecord && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}</div>}
                        </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail Modal */}
            {selectedDate && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in sm:p-4">
                <div className="bg-slate-900 w-full max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-slate-700 h-[85vh] sm:h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-800">
                    <button onClick={() => setSelectedDate(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><ChevronLeft size={20} /></button>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-400">{selectedDate}</span>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {modalMode === 'create' ? '목표 설정' : modalMode === 'log' ? '기록 입력' : '훈련 요약'}
                      </h3>
                    </div>
                    <div className="w-9"></div> 
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Target size={14}/> 훈련 목표</h4>
                        {modalMode === 'create' && (
                            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-700">
                                <button onClick={() => setGoalType('distance')} className={`px-2 py-1 text-[10px] rounded transition-all ${goalType === 'distance' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>거리주</button>
                                <button onClick={() => setGoalType('interval')} className={`px-2 py-1 text-[10px] rounded transition-all ${goalType === 'interval' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>인터벌</button>
                            </div>
                        )}
                        {modalMode === 'log' && (
                          <div className="flex gap-2">
                            <button onClick={handleDeleteGoal} className="p-1.5 bg-slate-800 rounded text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
                          </div>
                        )}
                      </div>
                      {(modalMode === 'create' || modalMode === 'edit') ? (
                        <>
                            {goalType === 'distance' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col items-center">
                                        <label className="text-[10px] text-slate-400 mb-2">목표 거리 (km)</label>
                                        <WheelPicker options={generateRange(0, 50)} value={pickerState.targetDistInt} onChange={(v) => setPickerState(prev => ({...prev, targetDistInt: v}))} label="km" width="w-16" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-[10px] text-slate-400 mb-2">목표 페이스</label>
                                        <div className="flex gap-1 items-end bg-slate-950/50 p-2 rounded-xl">
                                            <WheelPicker options={generateRange(2, 15)} value={pickerState.targetPaceMin} onChange={(v) => setPickerState(prev => ({...prev, targetPaceMin: v}))} label="분" width="w-10" />
                                            <div className="text-xl font-bold text-slate-500 mb-8">'</div>
                                            <WheelPicker options={generateRange(0, 59)} value={pickerState.targetPaceSec} onChange={(v) => setPickerState(prev => ({...prev, targetPaceSec: v}))} label="초" width="w-10" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center"><label className="text-[10px] text-slate-400 mb-2">세트 수</label><WheelPicker options={generateRange(1, 20)} value={pickerState.intervalSets} onChange={(v) => setPickerState(prev => ({...prev, intervalSets: v}))} label="회" width="w-12" /></div>
                                    <div className="flex flex-col items-center"><label className="text-[10px] text-slate-400 mb-2">질주 거리</label><WheelPicker options={[100, 200, 300, 400, 600, 800, 1000, 1200, 1600, 2000]} value={pickerState.intervalWorkDist} onChange={(v) => setPickerState(prev => ({...prev, intervalWorkDist: v}))} label="m" width="w-16" /></div>
                                    <div className="flex flex-col items-center"><label className="text-[10px] text-slate-400 mb-2">휴식 시간</label><WheelPicker options={[30, 60, 90, 120, 150, 180, 240, 300]} value={pickerState.intervalRestTime} onChange={(v) => setPickerState(prev => ({...prev, intervalRestTime: v}))} label="초" width="w-12" /></div>
                                    <div className="col-span-3 text-center mt-4 text-xs text-indigo-300">총 거리: {((pickerState.intervalSets * pickerState.intervalWorkDist) / 1000).toFixed(1)} km</div>
                                </div>
                            )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center py-2">
                          {goalType === 'interval' ? (
                              <div className="text-center">
                                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Timer size={20} className="text-indigo-400"/> {pickerState.intervalSets} x {pickerState.intervalWorkDist}m</div>
                                  <div className="text-xs text-indigo-300 mt-1">(휴식 {pickerState.intervalRestTime}초)</div>
                              </div>
                          ) : (
                              <div className="flex justify-around w-full">
                                <div className="text-center"><div className="text-3xl font-bold text-white">{pickerState.targetDistInt} <span className="text-sm font-normal text-slate-500">km</span></div></div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="text-center"><div className="text-3xl font-bold text-white">{pickerState.targetPaceMin}'{pickerState.targetPaceSec.toString().padStart(2,'0')}"</div></div>
                              </div>
                          )}
                        </div>
                      )}
                    </div>

                    {modalMode !== 'create' && (
                      <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/30 relative">
                         <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Activity size={14}/> 훈련 기록</h4>
                         {(modalMode === 'log' || modalMode === 'edit') ? (
                           <>
                             <div className="grid grid-cols-2 gap-4 mb-4">
                               <div className="flex flex-col items-center">
                                  <label className="text-[10px] text-slate-400 mb-2">실제 거리 (km)</label>
                                  <div className="flex gap-1 items-end bg-slate-950/50 p-2 rounded-xl"><WheelPicker options={generateRange(0, 50)} value={pickerState.actualDistInt} onChange={(v) => setPickerState(prev => ({...prev, actualDistInt: v}))} label="km" width="w-16" /></div>
                               </div>
                               <div className="flex flex-col items-center">
                                  <label className="text-[10px] text-slate-400 mb-2">주행 시간</label>
                                  <div className="flex gap-1 items-end bg-slate-950/50 p-2 rounded-xl">
                                     <WheelPicker options={generateRange(0, 300)} value={pickerState.actualTimeMin} onChange={(v) => setPickerState(prev => ({...prev, actualTimeMin: v}))} label="분" width="w-10" />
                                     <div className="text-xl font-bold text-slate-500 mb-8">:</div>
                                     <WheelPicker options={generateRange(0, 59)} value={pickerState.actualTimeSec} onChange={(v) => setPickerState(prev => ({...prev, actualTimeSec: v}))} label="초" width="w-10" />
                                  </div>
                               </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] text-slate-400 flex items-center gap-1"><ShoeIcon size={10}/> 러닝화 선택</label>
                                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white" value={pickerState.shoeId} onChange={(e) => setPickerState(prev => ({...prev, shoeId: e.target.value}))}>
                                  <option value="">러닝화 선택 안함</option>
                                  {shoes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mileage.toFixed(0)}km)</option>)}
                                </select>
                             </div>
                           </>
                         ) : (
                           <div className="space-y-4">
                             <div className="flex justify-around items-center py-2">
                                <div className="text-center"><div className="text-3xl font-bold text-white">{pickerState.actualDistInt} <span className="text-sm font-normal text-slate-500">km</span></div></div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="text-center"><div className="text-3xl font-bold text-white">{pickerState.actualTimeMin}:{pickerState.actualTimeSec.toString().padStart(2,'0')}</div></div>
                             </div>
                             <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800">{shoes.find(s => s.id === parseInt(pickerState.shoeId))?.name || "러닝화 미선택"}</div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>

                  <div className="p-6 pt-2 border-t border-slate-800 bg-slate-900 pb-safe">
                    {modalMode === 'create' && <button onClick={handleSaveGoal} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Save size={18}/> 목표 저장</button>}
                    {modalMode === 'log' && <div className="flex gap-3"><button onClick={() => handleComplete(true)} className="flex-[2] bg-lime-500 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2"><CheckCircle2 size={18}/> 달성</button><button onClick={() => handleComplete(false)} className="flex-1 bg-red-500/10 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2"><XCircle size={18}/> 미달성</button></div>}
                    {modalMode === 'view' && <div className="flex gap-3"><button onClick={() => setModalMode('edit')} className="flex-[2] bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Pencil size={18}/> 기록 수정</button><button onClick={handleDeleteRecord} className="flex-1 bg-red-500/10 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Trash2 size={18}/> 삭제</button></div>}
                    {modalMode === 'edit' && <button onClick={() => handleComplete(true)} className="w-full bg-lime-500 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2"><CheckCircle2 size={18}/> 수정 완료</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- RECORD TAB --- */}
        {activeTab === 'record' && (
          <div className="animate-fade-in">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Activity className="text-lime-400" /> 러닝 기록하기</h2>
             <p className="text-slate-400 mb-6 text-sm">목표 탭에서 날짜를 선택하여 기록하면 더 상세한 관리가 가능합니다.</p>
             <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="space-y-1"><label className="text-xs text-slate-400">날짜</label><input type="date" className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" value={recordForm.date} onChange={e => setRecordForm({...recordForm, date: e.target.value})} required /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">거리 (km)</label><input type="number" step="0.01" className="w-full bg-slate-800 border-none rounded-xl p-3 text-white font-bold text-lg" value={recordForm.distance} onChange={e => setRecordForm({...recordForm, distance: e.target.value})} required /></div>
                <div className="space-y-2"><label className="text-xs text-slate-400">러닝화 선택</label><select className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" value={recordForm.shoeId} onChange={e => setRecordForm({...recordForm, shoeId: e.target.value})}><option value="">선택 안함</option>{shoes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <button type="submit" className="w-full bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2"><CheckCircle2 /> 저장</button>
             </form>
          </div>
        )}

        {/* --- SHOES TAB --- */}
        {activeTab === 'shoes' && (
          <div className="animate-fade-in space-y-6 relative">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">내 기어룸 ({shoes.length}/5)</h2></div>
            
            <div className="space-y-4">
              {shoes.map(shoe => (
                <Card key={shoe.id} onClick={() => handleOpenShoeModal(shoe)} className="relative overflow-hidden group">
                   <div className="flex justify-between items-start relative z-10">
                      <div><div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{shoe.brand}</div><div className="text-lg font-bold text-white mb-2">{shoe.name}</div><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-lime-400">{shoe.mileage.toFixed(0)}</span><span className="text-xs text-slate-400">/ {shoe.maxMileage} km</span></div></div>
                      <div className={`w-10 h-10 rounded-full ${shoe.color} flex items-center justify-center text-slate-900`}><ShoeIcon size={20} /></div>
                    </div>
                    <div className="mt-4 relative z-10"><div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden"><div className={`h-full ${ (shoe.mileage / shoe.maxMileage) * 100 > 80 ? 'bg-red-500' : 'bg-lime-500'} transition-all duration-1000`} style={{width: `${Math.min((shoe.mileage / shoe.maxMileage) * 100, 100)}%`}}></div></div></div>
                    <ShoeIcon className="absolute -bottom-4 -right-4 text-slate-700/20 rotate-12" size={120} />
                </Card>
              ))}
            </div>
            {shoes.length < 5 && <button onClick={() => handleOpenShoeModal()} className="w-full bg-slate-800 p-4 rounded-xl font-bold text-slate-400 hover:bg-slate-700">+ 새 러닝화 추가</button>}

            {/* Shoe Modal */}
            {shoeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in sm:p-4">
                <div className="bg-slate-900 w-full max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl border-t sm:border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-800">
                    <button onClick={() => setShoeModalOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><ChevronLeft size={20} /></button>
                    <h3 className="text-lg font-bold text-white">{editingShoe ? '러닝화 수정' : '새 러닝화 추가'}</h3>
                    <div className="w-9"></div> 
                  </div>
                  <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">브랜드</label>
                      <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" placeholder="예: Nike" value={shoeForm.brand} onChange={(e) => setShoeForm({...shoeForm, brand: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">모델명</label>
                      <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" placeholder="예: Pegasus 40" value={shoeForm.name} onChange={(e) => setShoeForm({...shoeForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">현재 마일리지 (km)</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" value={shoeForm.mileage} onChange={(e) => setShoeForm({...shoeForm, mileage: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">최대 수명 (km)</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" value={shoeForm.maxMileage} onChange={(e) => setShoeForm({...shoeForm, maxMileage: parseFloat(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs text-slate-400">색상 테마</label>
                       <div className="flex gap-3 justify-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                         {SHOE_COLORS.map(c => (
                           <button key={c.value} onClick={() => setShoeForm({...shoeForm, color: c.value})} className={`w-8 h-8 rounded-full ${c.value} transition-transform ${shoeForm.color === c.value ? 'scale-125 ring-2 ring-white' : 'opacity-50 hover:opacity-100 hover:scale-110'}`} title={c.label}></button>
                         ))}
                       </div>
                    </div>
                  </div>
                  <div className="p-6 pt-4 border-t border-slate-800 bg-slate-900 pb-safe flex gap-3">
                    {editingShoe && (
                      <button onClick={handleDeleteShoe} className="flex-1 bg-red-500/10 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20">
                        <Trash2 size={18} /> 삭제
                      </button>
                    )}
                    <button onClick={handleSaveShoe} className={`bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${editingShoe ? 'flex-[2]' : 'w-full'}`}>
                      <Save size={18} /> 저장
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <nav className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe pt-2 px-6">
        <div className="flex justify-between items-center max-w-sm mx-auto h-14">
          <button onClick={() => setActiveTab('goals')} className={`flex flex-col items-center gap-1 ${activeTab === 'goals' ? 'text-lime-400' : 'text-slate-500'}`}><Calendar size={24} /><span className="text-[10px] font-medium">목표</span></button>
          <button onClick={() => setActiveTab('record')} className={`flex flex-col items-center gap-1 ${activeTab === 'record' ? 'text-lime-400' : 'text-slate-500'}`}><Plus size={24} strokeWidth={activeTab === 'record' ? 3 : 2} /><span className="text-[10px] font-medium">기록</span></button>
          <button onClick={() => setActiveTab('shoes')} className={`flex flex-col items-center gap-1 ${activeTab === 'shoes' ? 'text-lime-400' : 'text-slate-500'}`}><ShoeIcon size={24} /><span className="text-[10px] font-medium">러닝화</span></button>
        </div>
      </nav>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}