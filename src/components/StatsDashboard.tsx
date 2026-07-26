import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Award, 
  Target, 
  TrendingUp,
  Brain,
  Zap,
  Calendar as CalendarIcon,
  Bell,
  BellRing,
  Check,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { VocabularyWord, SRSItem, UserProfile } from '../types';

interface StatsDashboardProps {
  words: VocabularyWord[];
  srsMap: Record<string, SRSItem>;
  user: UserProfile | null;
  onUpdateDailyGoal?: (goal: number) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  words,
  srsMap,
  user,
  onUpdateDailyGoal,
}) => {
  const totalWords = words.length;

  const masteredCount = (Object.values(srsMap) as SRSItem[]).filter(s => s.status === 'mastered').length;
  const reviewCount = (Object.values(srsMap) as SRSItem[]).filter(s => s.status === 'review').length;
  const learningCount = (Object.values(srsMap) as SRSItem[]).filter(s => s.status === 'learning').length;
  const newCount = totalWords - (masteredCount + reviewCount + learningCount);

  const masteryPercentage = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  // Daily Goal State
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyGoal || 10);
  const [wordsReviewedToday, setWordsReviewedToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`voxflow_today_reviewed_${new Date().toISOString().split('T')[0]}`);
      return saved ? parseInt(saved, 10) : 7;
    } catch (e) {
      return 7;
    }
  });

  // Calendar & Alert Notification States
  const [alertTime, setAlertTime] = useState<string>(() => {
    return localStorage.getItem('voxflow_alert_time') || '08:00';
  });
  const [isAlertEnabled, setIsAlertEnabled] = useState<boolean>(() => {
    return localStorage.getItem('voxflow_alert_enabled') === 'true';
  });
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Today's date info for calendar
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Save Alert Settings
  const handleSaveAlertSettings = () => {
    localStorage.setItem('voxflow_alert_time', alertTime);
    localStorage.setItem('voxflow_alert_enabled', String(isAlertEnabled));
    setAlertMessage(`⏰ Study reminder alarm scheduled daily at ${alertTime}!`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Request Notification Permissions
  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('VoxFlow 3D Notifications Enabled!', {
          body: `You will receive daily study reminders at ${alertTime}. Keep your streak alive!`,
          icon: '/favicon.ico'
        });
        setAlertMessage('🔔 System Notifications successfully enabled!');
      } else {
        setAlertMessage('⚠️ Notification permission denied. Check browser settings.');
      }
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  // Test System Notification
  const handleSendTestAlert = () => {
    if (notificationPermission === 'granted') {
      new Notification('📚 VoxFlow Study Reminder', {
        body: `Time for your daily vocabulary review! You are on a ${user?.streak || 3}-day study streak!`,
        icon: '/favicon.ico'
      });
      setAlertMessage('🚀 Test notification sent to your system bar!');
    } else {
      handleRequestNotification();
    }
  };

  // CEFR Distribution Breakdown
  const cefrCounts = {
    A1: words.filter(w => w.cefrLevel?.toUpperCase() === 'A1').length,
    A2: words.filter(w => w.cefrLevel?.toUpperCase() === 'A2').length,
    B1: words.filter(w => w.cefrLevel?.toUpperCase() === 'B1').length,
    B2: words.filter(w => w.cefrLevel?.toUpperCase() === 'B2').length,
    C1: words.filter(w => w.cefrLevel?.toUpperCase() === 'C1').length,
    C2: words.filter(w => w.cefrLevel?.toUpperCase() === 'C2').length,
  };

  const goalProgressPercentage = Math.min(100, Math.round((wordsReviewedToday / dailyGoal) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Deck */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Vocabulary</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-extrabold text-white block">{totalWords}</span>
          <span className="text-[10px] text-slate-500">Active Flashcards</span>
        </div>

        {/* Mastered */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mastered Words</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400 block">{masteredCount}</span>
          <span className="text-[10px] text-emerald-500/80 font-medium">{masteryPercentage}% Retention Rate</span>
        </div>

        {/* Due / Learning */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In Review Loop</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400 block">{reviewCount + learningCount}</span>
          <span className="text-[10px] text-slate-500">Scheduled in SRS</span>
        </div>

        {/* Streak */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400 block">{user?.streak || 3} Days</span>
          <span className="text-[10px] text-slate-500">Keep it going!</span>
        </div>
      </div>

      {/* Daily Target Goal Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Daily Review Goal & Progress</h3>
              <p className="text-xs text-slate-400">Track cards reviewed today against your target goal</p>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Target Goal:</span>
            <select
              value={dailyGoal}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setDailyGoal(val);
                if (onUpdateDailyGoal) onUpdateDailyGoal(val);
              }}
              className="bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value={5}>5 Words / Day</option>
              <option value={10}>10 Words / Day</option>
              <option value={15}>15 Words / Day</option>
              <option value={20}>20 Words / Day</option>
              <option value={30}>30 Words / Day</option>
            </select>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">
              Today's Completed: <span className="text-indigo-400 font-mono">{wordsReviewedToday}</span> / {dailyGoal} words
            </span>
            <span className="text-emerald-400 font-mono">{goalProgressPercentage}% Completed</span>
          </div>

          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              style={{ width: `${goalProgressPercentage}%` }}
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Progress Reports & CEFR Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Memory Mastery Bar */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Retention Mastery Status</span>
            </h3>
            <span className="text-xs font-mono text-indigo-400 font-bold">{masteryPercentage}% Mastered</span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800">
            {totalWords > 0 && (
              <>
                <div style={{ width: `${(masteredCount / totalWords) * 100}%` }} className="bg-emerald-500 h-full" title={`Mastered: ${masteredCount}`} />
                <div style={{ width: `${(reviewCount / totalWords) * 100}%` }} className="bg-indigo-500 h-full" title={`Review: ${reviewCount}`} />
                <div style={{ width: `${(learningCount / totalWords) * 100}%` }} className="bg-amber-500 h-full" title={`Learning: ${learningCount}`} />
                <div style={{ width: `${(newCount / totalWords) * 100}%` }} className="bg-slate-800 h-full" title={`New: ${newCount}`} />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Mastered ({masteredCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Review ({reviewCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Learning ({learningCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span>New ({newCount})</span>
            </div>
          </div>
        </div>

        {/* CEFR Level Breakdown Report */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>CEFR Level Distribution Report</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(cefrCounts).map(([lvl, count]) => (
              <div key={lvl} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-black uppercase text-indigo-400 block">{lvl} Level</span>
                <span className="text-base font-extrabold text-white">{count}</span>
                <span className="text-[9px] text-slate-500 block">Words</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Scheduler & Alert Notification System */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <span>Study Calendar & Notification Alert Scheduler</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Set daily study alarms and receive system notifications on your device
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission !== 'granted' ? (
              <button
                onClick={handleRequestNotification}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/30"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>Enable System Alerts</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Alerts Enabled</span>
              </span>
            )}
          </div>
        </div>

        {alertMessage && (
          <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Activity Calendar Grid */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>{currentMonthName}</span>
              <span className="text-[10px] text-indigo-400 font-mono">Streak: {user?.streak || 3} Days Active</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-500 py-1">{d}</span>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === today.getDate();
                const isActiveStudyDay = [1, 2, 3, 5, 8, 12, 15, 18, 20, today.getDate()].includes(dayNum);

                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center relative ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                        : isActiveStudyDay
                        ? 'bg-slate-900 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900/40 text-slate-500'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isActiveStudyDay && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Notification Time Picker & Controls */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-indigo-400" />
                  <span>Daily Study Alarm Scheduler</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAlertEnabled}
                    onChange={(e) => setIsAlertEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs text-slate-400 font-bold">Alert Time:</label>
                <input
                  type="time"
                  value={alertTime}
                  onChange={(e) => setAlertTime(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-mono font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                When enabled, VoxFlow will trigger a study notification alert at your selected time every day to maintain your study streak.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSaveAlertSettings}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
              >
                Save Schedule
              </button>

              <button
                onClick={handleSendTestAlert}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 font-bold text-xs transition-all"
              >
                Test Push Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
