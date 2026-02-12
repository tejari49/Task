import React, { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle2, Circle, Plus, Trash2, 
  User, Users, Share2, X, Home, Briefcase, 
  ShoppingCart, Mountain, Music, Coffee, Heart, 
  ChevronRight, ArrowLeft, Flame, Minus, Moon, Sun,
  Repeat, MessageSquare, Send, Check, ListTodo, 
  Settings, Fingerprint, LogOut, ShieldCheck, Smartphone, Bell
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { usePushNotifications } from './usePushNotifications';

// --- KATEGORIEN KONFIGURATION ---
const CATEGORIES = [
  { id: 'termin', label: 'Termin', icon: Calendar, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'arbeit', label: 'Arbeit', icon: Briefcase, color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  { id: 'essen', label: 'Einkauf', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'sport', label: 'Sport', icon: Mountain, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'freizeit', label: 'Freizeit', icon: Coffee, color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'party', label: 'Feier', icon: Music, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'familie', label: 'Familie', icon: Home, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'date', label: 'Date', icon: Heart, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
];

const PRIORITIES = [
  { id: 'high', label: 'Wichtig', icon: Flame, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900', activeClass: 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1' },
  { id: 'normal', label: 'Normal', icon: Circle, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900', activeClass: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1' },
  { id: 'low', label: 'Hat Zeit', icon: Minus, color: 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', activeClass: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 ring-1' },
];

const DEFAULT_PROFILE = {
  name: 'Max Mustermann',
  id: 'USER-8291',
  email: 'max@beispiel.de',
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  
  // Views
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeGroup, setActiveGroup] = useState(null); 
  const [activeTask, setActiveTask] = useState(null); 
  const [dashboardTab, setDashboardTab] = useState('active'); 

  // Gamification & User
  const [streak, setStreak] = useState(5);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  
  // User Profil State
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE);
  const [authError, setAuthError] = useState('');

  // Daten (Simuliert)
  const [friends, setFriends] = useState([
    { id: 1, name: 'Anna', avatar: 'Anna' },
    { id: 2, name: 'Tom', avatar: 'Tom' }
  ]);
  const [groups, setGroups] = useState([
    { id: 101, name: 'WG Küche', memberCount: 3 }
  ]);
  const [tasks, setTasks] = useState([
    { 
      id: 1, title: 'Wocheneinkauf', category: 'essen', priority: 'normal', 
      date: new Date().toISOString().split('T')[0], time: '', 
      completed: false, completedBy: null, assignType: 'group', assignTargetId: 101, 
      repeat: 'none', comments: [], 
      subtasks: [
        { id: 10, text: 'Milch', completed: false },
        { id: 11, text: 'Brot', completed: true }
      ]
    }
  ]);

  // Formular States
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('termin');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');
  const [newTaskDate, setNewTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskRepeat, setNewTaskRepeat] = useState('none');
  const [assignType, setAssignType] = useState('private'); 
  const [assignTargetId, setAssignTargetId] = useState(null); 
  const [newFriendName, setNewFriendName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Push Notifications State
  const [, setNotificationBadge] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  // Push Notifications Hook
  const { token: pushToken, permission: pushPermission, isSupported: pushSupported, requestPermission: requestPushPermission } = usePushNotifications({
    onNotificationReceived: (notification, source) => {
      console.log('Notification empfangen:', notification, 'von', source);
      setLastNotification({
        title: notification.title || notification.body?.title || 'TaskRai',
        body: notification.body?.body || notification.body || '',
        data: notification.data,
        timestamp: new Date().toISOString()
      });
      setNotificationBadge(prev => prev + 1);
    },
    onTokenReceived: (token, platform) => {
      console.log('Push Token empfangen:', token, 'Platform:', platform);
      // TODO: Token an Backend/Firestore senden um User zu identifizieren
      // Beispiel: saveTokenToFirestore(userProfile.id, token, platform)
    }
  });

  // --- LOGIK ---

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserProfile({
          name: user.displayName || user.email?.split('@')[0] || 'TaskRai Nutzer',
          id: user.uid,
          email: user.email || '',
        });
      } else {
        setIsAuthenticated(false);
        setUserProfile(DEFAULT_PROFILE);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError('');
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError('Firebase ist nicht konfiguriert.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Firebase login failed', error);
      setAuthError('Anmeldung fehlgeschlagen.');
    }
  };

  const handleLogout = async () => {
    setAuthError('');
    try {
      if (auth) {
        await signOut(auth);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Firebase logout failed', error);
      setAuthError('Abmeldung fehlgeschlagen.');
    } finally {
      setCurrentView('dashboard');
    }
  };

  const groupTasksByDate = (taskList) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    taskList.forEach(task => {
      const taskDate = new Date(task.date);
      let key = "";
      const isToday = taskDate.toDateString() === today.toDateString();
      const isYesterday = taskDate.toDateString() === yesterday.toDateString();
      const oneJan = new Date(taskDate.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((taskDate - oneJan) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((taskDate.getDay() + 1 + numberOfDays) / 7);

      if (isToday) key = "Heute";
      else if (isYesterday) key = "Gestern";
      else {
        const currentWeekNum = Math.ceil((today.getDay() + 1 + Math.floor((today - new Date(today.getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000))) / 7);
        if (taskDate.getFullYear() === today.getFullYear() && weekNum === currentWeekNum) key = "Diese Woche";
        else key = taskDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  };

  const addTask = () => {
    if (!newTaskTitle || !newTaskDate) return;
    const newTask = {
      id: Date.now(), title: newTaskTitle, category: newTaskCategory, priority: newTaskPriority,
      date: newTaskDate, time: newTaskTime || '', completed: false, completedBy: null,
      assignType: assignType, assignTargetId: assignTargetId, repeat: newTaskRepeat,
      comments: [], subtasks: [], createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(''); setNewTaskPriority('normal'); setNewTaskRepeat('none');
    setCurrentView('dashboard');
  };

  const completeTask = (task) => {
    const isNowCompleted = !task.completed;
    if (isNowCompleted) {
      const today = new Date().toISOString().split('T')[0];
      if (lastCompletedDate !== today) { setStreak(s => s + 1); setLastCompletedDate(today); }
    }
    if (isNowCompleted && task.repeat !== 'none') {
      const nextDate = new Date(task.date);
      if (task.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (task.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      const recurringTask = { ...task, id: Date.now(), completed: false, completedBy: null, date: nextDate.toISOString().split('T')[0], comments: [], subtasks: task.subtasks.map(s => ({...s, completed: false})) };
      setTasks(prev => [...prev.map(t => t.id === task.id ? { ...t, completed: true, completedBy: userProfile.name } : t), recurringTask]);
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed, completedBy: !t.completed ? userProfile.name : null } : t));
    }
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (activeTask && activeTask.id === taskId) { setCurrentView('dashboard'); setActiveTask(null); }
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim() || !activeTask) return;
    const newSub = { id: Date.now(), text: newSubtaskText, completed: false };
    const updatedTask = { ...activeTask, subtasks: [...(activeTask.subtasks || []), newSub] };
    setTasks(tasks.map(t => t.id === activeTask.id ? updatedTask : t));
    setActiveTask(updatedTask); setNewSubtaskText('');
  };

  const toggleSubtask = (subtaskId) => {
    if (!activeTask) return;
    const updatedSubtasks = activeTask.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const updatedTask = { ...activeTask, subtasks: updatedSubtasks };
    setTasks(tasks.map(t => t.id === activeTask.id ? updatedTask : t));
    setActiveTask(updatedTask);
  };

  const sendComment = () => {
    if (!chatMessage.trim() || !activeTask) return;
    const newComment = { id: Date.now(), text: chatMessage, author: userProfile.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updatedTask = { ...activeTask, comments: [...activeTask.comments, newComment] };
    setTasks(tasks.map(t => t.id === activeTask.id ? updatedTask : t));
    setActiveTask(updatedTask); setChatMessage('');
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    setGroups([...groups, { id: Date.now(), name: newGroupName, memberCount: 1 }]); setNewGroupName('');
  };

  const addFriend = () => {
    if (!newFriendName.trim()) return;
    setFriends([...friends, { id: Date.now(), name: newFriendName, avatar: newFriendName }]); setNewFriendName('');
  };

  const openTaskDetail = (task) => { setActiveTask(task); setCurrentView('taskDetail'); };

  const getCategoryDetails = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

  const getVisibleTasks = (filterCompleted = false) => {
    let filtered = [...tasks];
    filtered = filtered.filter(t => t.completed === filterCompleted);
    if (currentView === 'groupDetail' && activeGroup) {
      filtered = filtered.filter(t => t.assignType === 'group' && t.assignTargetId === activeGroup.id);
    } 
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      if (filterCompleted) return dateB - dateA;
      if (a.category === 'essen' && b.category !== 'essen') return -1;
      if (a.category !== 'essen' && b.category === 'essen') return 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return dateA - dateB;
    });
  };

  const getGroupProgress = (groupId) => {
    const groupTasks = tasks.filter(t => t.assignType === 'group' && t.assignTargetId === groupId);
    if (groupTasks.length === 0) return 0;
    const completed = groupTasks.filter(t => t.completed).length;
    return Math.round((completed / groupTasks.length) * 100);
  };

  // --- COMPONENTS ---

  const Avatar = ({ seed, size = "md" }) => {
      const sizeClasses = size === "lg" ? "w-20 h-20" : size === "xl" ? "w-32 h-32" : "w-10 h-10";
      // Dicebear API für Avatare
      const fallbackLetter = (seed || '?').trim().charAt(0).toUpperCase() || '?';
      const fallbackSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#6b7280">${fallbackLetter}</text></svg>`)}`;
      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      return (
          <img
            src={url}
            alt="Avatar"
            className={`${sizeClasses} rounded-full bg-gray-100 dark:bg-gray-800 object-cover border-2 border-white dark:border-gray-700 shadow-sm`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSvg;
            }}
          />
      );
  };

  const TaskCard = ({ task }) => {
    const CategoryIcon = getCategoryDetails(task.category).icon;
    const categoryStyle = getCategoryDetails(task.category).color;
    const isHighPriority = task.priority === 'high' && !task.completed;
    const isShoppingItem = task.category === 'essen';
    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    const subtaskCompleted = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

    if (isShoppingItem) {
        return (
            <div className={`relative rounded-lg p-2 px-3 shadow-sm border flex items-center gap-3 transition-all mb-2 ${task.completed ? 'opacity-60 bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800' : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800'}`}>
                <button onClick={(e) => { e.stopPropagation(); completeTask(task); }} className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-orange-500'}`}>
                    {task.completed && <Check size={16} />}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer flex flex-col" onClick={() => openTaskDetail(task)}>
                     <div className="flex justify-between items-center">
                        <span className={`text-base ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100 font-medium'} ${isHighPriority ? 'text-red-600 dark:text-red-400' : ''}`}>{task.title}</span>
                        {subtaskCount > 0 && <span className="text-[10px] text-gray-400">{subtaskCompleted}/{subtaskCount}</span>}
                     </div>
                     {task.completed && task.completedBy && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Erledigt von {task.completedBy}</span>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
        );
    }
    return (
      <div className={`relative rounded-xl p-3 shadow-sm border flex items-center gap-3 transition-all mb-2 ${task.completed ? 'opacity-50 bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800' : isHighPriority ? 'bg-white border-red-200 shadow-red-50 dark:bg-gray-900 dark:border-red-900/50' : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800'}`}>
        <button onClick={(e) => { e.stopPropagation(); completeTask(task); }} className="flex-shrink-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {task.completed ? <CheckCircle2 size={24} className="text-green-500 dark:text-green-400" /> : <Circle size={24} />}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'} ${isHighPriority ? 'text-red-600 dark:text-red-400' : ''}`}>{task.title}</h3>
            {subtaskCount > 0 && <div className="flex items-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 rounded"><ListTodo size={12} className="mr-1" /> {subtaskCompleted}/{subtaskCount}</div>}
          </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${categoryStyle}`}>{getCategoryDetails(task.category).label}</span>
              {task.completed && task.completedBy && <span className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">Von: {task.completedBy}</span>}
              {task.repeat !== 'none' && <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded flex items-center gap-1"><Repeat size={10} /> {task.repeat === 'daily' ? 'Tägl.' : 'Wöch.'}</span>}
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">{new Date(task.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
            </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 p-1"><Trash2 size={16} /></button>
      </div>
    );
  };

  const Navigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center z-20 safe-area-bottom">
      <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center space-y-1 ${currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}><Calendar size={24} /></button>
      <button onClick={() => setCurrentView('groups')} className={`flex flex-col items-center space-y-1 ${currentView === 'groups' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}><Users size={24} /></button>
      <button onClick={() => setCurrentView('addTask')} className="flex flex-col items-center justify-center -mt-8"><div className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg active:scale-95 border-4 border-slate-50 dark:border-black"><Plus size={28} /></div></button>
      <button onClick={() => setCurrentView('friends')} className={`flex flex-col items-center space-y-1 ${currentView === 'friends' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}><User size={24} /></button>
    </div>
  );

  // --- VIEWS ---

  const LoginView = () => (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="z-10 text-center w-full max-w-sm">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Smartphone size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">TaskRai</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-12">Organisiere dein Leben. <br/>Verbinde dich mit Freunden.</p>
              <div className="space-y-4">
                  <button onClick={handleLogin} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 group">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                      <span className="font-semibold text-gray-700 dark:text-white">Mit Google anmelden</span>
                  </button>
                  {authError && <p className="text-xs text-center text-red-500">{authError}</p>}
                  <p className="text-xs text-center text-gray-400 mt-6 max-w-xs mx-auto">Mit der Anmeldung akzeptierst du unsere Nutzungsbedingungen.</p>
              </div>
          </div>
      </div>
  );

  const SettingsView = () => (
    <div className="pb-24 pt-6 px-4 h-screen overflow-y-auto">
        <header className="mb-6 flex items-center gap-3">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
        </header>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 text-center">
            <div className="mx-auto mb-4 flex justify-center"><Avatar seed={userProfile.name} size="xl" /></div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Anzeigename</label>
            <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="text-center text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 mb-4 focus:outline-none focus:border-blue-500 w-full" />
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Fingerprint size={16} className="text-gray-400" /><div className="text-left"><p className="text-[10px] text-gray-400 uppercase font-bold">ID</p><p className="text-sm font-mono text-gray-700 dark:text-gray-200">{userProfile.id}</p></div></div>
            </div>
        </div>
        <div className="space-y-2">
            {/* Push Notifications Einstellung */}
            {pushSupported && (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <Bell size={20} />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Push Benachrichtigungen</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pushPermission === 'granted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    pushPermission === 'denied' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {pushPermission === 'granted' ? 'Aktiv' : pushPermission === 'denied' ? 'Blockiert' : 'Inaktiv'}
                  </div>
                </div>
                {pushPermission !== 'granted' && (
                  <button 
                    onClick={requestPushPermission}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Benachrichtigungen aktivieren
                  </button>
                )}
                {pushToken && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                    Token: {pushToken.substring(0, 20)}...
                  </div>
                )}
                {lastNotification && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">Letzte Benachrichtigung:</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lastNotification.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{lastNotification.body}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3"><div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">{isDarkMode ? <Moon size={20} /> : <Sun size={20} />}</div><span className="font-medium text-gray-900 dark:text-white">Dunkelmodus</span></div>
                <div onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-6' : ''}`}></div></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 group" onClick={handleLogout}>
                <div className="flex items-center gap-3"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"><LogOut size={20} /></div><span className="font-medium text-red-600 dark:text-red-400">Abmelden</span></div>
            </div>
        </div>
    </div>
  );

  const DashboardView = () => {
    const isShowingCompleted = dashboardTab === 'completed';
    const visibleTasks = getVisibleTasks(isShowingCompleted);
    const groupedTasks = isShowingCompleted ? groupTasksByDate(visibleTasks) : null;

    return (
      <div className="pb-24 pt-6 px-4 h-screen overflow-y-auto">
        <header className="mb-6 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <div onClick={() => setCurrentView('settings')}><Avatar seed={userProfile.name} /></div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Hallo, {userProfile.name.split(' ')[0]}</h1>
                <div className="flex items-center gap-2 mt-1"><span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full"><Flame size={10} className="fill-orange-500" /> {streak} Streak</span></div>
             </div>
          </div>
          <button onClick={() => setCurrentView('settings')} className="p-2 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"><Settings size={20} /></button>
        </header>
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-6 sticky top-0 z-10">
          <button onClick={() => setDashboardTab('active')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isShowingCompleted ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Offen</button>
          <button onClick={() => setDashboardTab('completed')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isShowingCompleted ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>Historie</button>
        </div>
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60"><div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4"><Calendar size={48} className="text-gray-400" /></div><p className="text-gray-500 dark:text-gray-400">Keine Aufgaben gefunden.</p></div>
        ) : (
          <div className="space-y-1">
            {!isShowingCompleted && visibleTasks.map(task => <TaskCard key={task.id} task={task} />)}
            {isShowingCompleted && groupedTasks && Object.keys(groupedTasks).map(groupName => (
                <div key={groupName} className="mb-4"><h3 className="text-xs font-bold text-gray-400 uppercase mb-2 pl-1 sticky top-14 bg-slate-50 dark:bg-black py-2 z-0">{groupName}</h3>{groupedTasks[groupName].map(task => <TaskCard key={task.id} task={task} />)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const TaskDetailView = () => {
    if (!activeTask) return null;
    const CategoryIcon = getCategoryDetails(activeTask.category).icon;
    const subtaskTotal = activeTask.subtasks ? activeTask.subtasks.length : 0;
    const subtaskCompleted = activeTask.subtasks ? activeTask.subtasks.filter(s => s.completed).length : 0;
    const subtaskProgress = subtaskTotal > 0 ? (subtaskCompleted / subtaskTotal) * 100 : 0;

    return (
      <div className="pb-24 pt-6 px-4 bg-white dark:bg-black min-h-screen absolute top-0 left-0 w-full z-30 overflow-y-auto">
        <header className="mb-6 flex items-center gap-3 sticky top-0 bg-white dark:bg-black z-10 py-2">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Details</h1>
        </header>
        <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-full ${getCategoryDetails(activeTask.category).color}`}><CategoryIcon size={24} /></div><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeTask.title}</h2><p className="text-sm text-gray-500 dark:text-gray-400">{new Date(activeTask.date).toLocaleDateString('de-DE')} • {activeTask.time || 'Ganztägig'}</p></div></div>
          <div className="flex gap-2 flex-wrap">
            {activeTask.completedBy && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 size={12} /> Erledigt von {activeTask.completedBy}</span>}
            {activeTask.priority === 'high' && <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded flex items-center gap-1"><Flame size={12} /> Wichtig</span>}
          </div>
        </div>
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Checkliste</h3>{subtaskTotal > 0 && <span className="text-xs text-gray-400">{subtaskCompleted}/{subtaskTotal}</span>}</div>
            {subtaskTotal > 0 && (<div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }}></div></div>)}
            <div className="space-y-2 mb-4">
                {activeTask.subtasks && activeTask.subtasks.map(sub => (<div key={sub.id} onClick={() => toggleSubtask(sub.id)} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl cursor-pointer hover:border-blue-300 transition-colors"><div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>{sub.completed && <Check size={12} />}</div><span className={`text-sm ${sub.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{sub.text}</span></div>))}
            </div>
            <div className="flex gap-2"><input type="text" value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} placeholder="Teilaufgabe..." className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" onKeyDown={(e) => e.key === 'Enter' && addSubtask()} /><button onClick={addSubtask} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"><Plus size={20} /></button></div>
        </div>
        <div className="mb-20">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Notizen</h3>
          <div className="space-y-4 mb-6">
            {activeTask.comments && activeTask.comments.length > 0 ? (activeTask.comments.map(c => (<div key={c.id} className="flex gap-3"><Avatar seed={c.author} size="sm" /><div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-r-xl rounded-bl-xl max-w-[80%]"><p className="text-xs text-gray-500 mb-1">{c.author}</p><p className="text-sm text-gray-800 dark:text-gray-200">{c.text}</p><span className="text-[10px] text-gray-400 mt-1 block">{c.time}</span></div></div>))) : (<p className="text-center text-gray-400 text-sm py-4">Noch keine Nachrichten.</p>)}
          </div>
          <div className="flex gap-2 items-center fixed bottom-6 left-4 right-4 bg-white dark:bg-black p-2 border border-gray-200 dark:border-gray-800 rounded-full shadow-lg">
            <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Kommentar..." className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-gray-900 dark:text-white" />
            <button onClick={sendComment} className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700"><Send size={18} /></button>
          </div>
        </div>
      </div>
    );
  };

  const AddTaskView = () => (
    <div className="h-full bg-white dark:bg-black z-30 absolute top-0 left-0 w-full flex flex-col">
      <header className="flex-shrink-0 px-4 pt-6 pb-2 flex items-center justify-between bg-white dark:bg-black z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Neuer Eintrag</h1>
        <button onClick={() => setCurrentView('dashboard')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><X size={24} /></button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-24">
          <div className="space-y-6 pt-4">
            <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Titel</label><input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="z.B. Milch, Meeting..." className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg dark:text-white" autoFocus /></div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Kategorie</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewTaskCategory(cat.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${newTaskCategory === cat.id ? 'border-blue-500 ring-1 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 dark:bg-gray-900'}`}>
                    <cat.icon size={18} className={`mb-1 ${newTaskCategory === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <span className={`text-[10px] font-medium ${newTaskCategory === cat.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Wichtigkeit</label>
              <div className="flex gap-2">
                {PRIORITIES.map(prio => (
                  <button key={prio.id} onClick={() => setNewTaskPriority(prio.id)} className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${newTaskPriority === prio.id ? prio.activeClass : 'border-gray-200 dark:border-gray-800 dark:text-gray-400'}`}>
                    <prio.icon size={20} /> <span className="text-xs">{prio.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Datum</label><input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl dark:text-white dark:[color-scheme:dark]" /></div>
              <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Uhrzeit</label><input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl dark:text-white dark:[color-scheme:dark]" /></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Zuweisen an</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button onClick={() => { setAssignType('private'); setAssignTargetId(null); }} className={`px-4 py-2 rounded-full border whitespace-nowrap text-sm ${assignType === 'private' ? 'bg-gray-800 text-white dark:bg-gray-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Nur ich</button>
                {groups.map(g => (<button key={g.id} onClick={() => { setAssignType('group'); setAssignTargetId(g.id); }} className={`px-4 py-2 rounded-full border whitespace-nowrap text-sm ${assignType === 'group' && assignTargetId === g.id ? 'bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>{g.name}</button>))}
                {friends.map(f => (<button key={f.id} onClick={() => { setAssignType('friend'); setAssignTargetId(f.id); }} className={`px-4 py-2 rounded-full border whitespace-nowrap text-sm ${assignType === 'friend' && assignTargetId === f.id ? 'bg-purple-600 text-white' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>{f.name}</button>))}
              </div>
            </div>
            <button onClick={addTask} disabled={!newTaskTitle || !newTaskDate} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ${!newTaskTitle || !newTaskDate ? 'bg-gray-300 dark:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Speichern</button>
          </div>
      </div>
    </div>
  );

  const GroupsView = () => (
    <div className="pb-24 pt-6 px-4 h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Gruppen</h1>
      <div className="flex gap-2 mb-6"><input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Neue Gruppe..." className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg dark:border-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" /><button onClick={createGroup} className="bg-indigo-600 text-white px-4 rounded-lg"><Plus /></button></div>
      {groups.map(g => (<div key={g.id} onClick={() => { setActiveGroup(g); setCurrentView('dashboard'); }} className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl mb-3 cursor-pointer shadow-sm hover:border-indigo-200 transition-all"><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-3"><div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400"><Users size={20} /></div><div><h3 className="font-bold text-gray-900 dark:text-white">{g.name}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{getGroupProgress(g.id)}% Erledigt</p></div></div><ChevronRight size={16} className="text-gray-400" /></div><div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${getGroupProgress(g.id)}%` }}></div></div></div>))}
    </div>
  );
  
  const FriendsView = () => (
    <div className="pb-24 pt-6 px-4 h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Freunde</h1>
      <div className="flex gap-2 mb-4"><input type="text" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} placeholder="Name..." className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border rounded-lg dark:border-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500" /><button onClick={addFriend} className="bg-purple-600 text-white px-4 rounded-lg"><Plus /></button></div>
      {friends.map(f => (<div key={f.id} className="p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl mb-2 flex items-center gap-3"><Avatar seed={f.name} /><span className="font-bold dark:text-white">{f.name}</span></div>))}
    </div>
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-black font-sans text-gray-900">
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-black relative shadow-2xl dark:shadow-none overflow-hidden border-x border-gray-200 dark:border-gray-900">
          {!isAuthenticated ? <LoginView /> : (
            <>
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'taskDetail' && <TaskDetailView />}
              {currentView === 'addTask' && <AddTaskView />}
              {currentView === 'groups' && <GroupsView />}
              {currentView === 'friends' && <FriendsView />}
              {currentView === 'settings' && <SettingsView />}
              {currentView !== 'addTask' && currentView !== 'taskDetail' && currentView !== 'settings' && <Navigation />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
