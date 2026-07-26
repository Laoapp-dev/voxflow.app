import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  Mic, 
  HelpCircle, 
  Gamepad2, 
  Edit3, 
  Table, 
  Sparkles, 
  UserCheck, 
  Settings, 
  X,
  Database,
  CloudUpload,
  Bot,
  Smartphone,
  Award,
  ShieldCheck,
  Star
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenSyncModal: () => void;
  onOpenAccountModal: () => void;
  userRole?: 'admin' | 'learner';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  onClose,
  user,
  onOpenSyncModal,
  onOpenAccountModal,
  userRole = 'learner',
}) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard & Goals', icon: LayoutDashboard },
    { id: 'speaking_library', label: 'Speaking Practice (A1–C2)', icon: Mic },
    { id: 'level_challenge', label: 'Speaking Level Challenge', icon: Award },
    { id: 'categories', label: 'Categories & Lessons', icon: Layers },
    { id: 'flashcards', label: '3D Flashcards', icon: BookOpen },
    { id: 'favorites', label: 'Starred Favorites', icon: Star },
    { id: 'shadowing', label: 'Shadowing AI Practice', icon: Mic },
    { id: 'quiz', label: 'Quiz Mode', icon: HelpCircle },
    { id: 'matching', label: 'Matching Game', icon: Gamepad2 },
    { id: 'spelling', label: 'Spelling Challenge', icon: Edit3 },
    { id: 'table', label: 'Vocabulary Table', icon: Table, adminOnly: true },
    { id: 'ai-coach', label: 'AI Feedback & Generator', icon: Bot },
  ];

  // Filter out admin-only items if user is learner
  const navItems = allNavItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    return true;
  });

  if (userRole === 'admin') {
    navItems.unshift({ id: 'admin-panel', label: 'Admin Management Panel', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-lg">
              V
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base leading-none">VoxFlow 3D</h1>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Vocab & Shadowing</span>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block my-2">
            Main Learning Hub
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Mobile PWA App Badge */}
          <div className="pt-3 border-t border-slate-800/80 my-2">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1.5">
              Smartphone App (PWA)
            </span>
            <div className="mx-1 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Install on Smartphone</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Tap Chrome menu (⋮) or Safari Share ➔ "Add to Home Screen"
              </p>
            </div>
          </div>

          {userRole === 'admin' && (
            <div className="pt-4 border-t border-slate-800/80 my-2">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-2">
                Sync & Admin Settings
              </span>

              {/* Google Sheets Sync Button */}
              <button
                onClick={() => {
                  onOpenSyncModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20 transition-all mb-1.5"
              >
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Sync</span>
              </button>

              {/* Account & Firestore Storage */}
              <button
                onClick={() => {
                  onOpenAccountModal();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-950/40 border border-purple-500/20 transition-all"
              >
                <Database className="w-4 h-4 text-purple-400" />
                <span>Account & Cloud Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div 
            onClick={onOpenAccountModal}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  {user?.displayName ? user.displayName[0] : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.displayName || 'Learner Account'}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                  <span className="capitalize font-semibold">{userRole} Role</span>
                </p>
              </div>
            </div>

            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
