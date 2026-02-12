import React, { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle2, Circle, Plus, Trash2, 
  User, Users, Share2, X, Home, Briefcase, 
  ShoppingCart, Mountain, Music, Coffee, Heart, 
  ChevronRight, ArrowLeft, Flame, Minus, Moon, Sun,
  Repeat, MessageSquare, Send, Check, ListTodo, 
  Settings, Fingerprint, LogOut, ShieldCheck, Smartphone, Bell
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// ✅ ÄNDERUNG 1: Imports erweitern
import { auth, isFirebaseConfigured, isAndroid, getAndroidFCMToken, requestFCMToken, googleSignIn } from './firebase';
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
    onMessage: (payload) => {
      setLastNotification(payload);
      setNotificationBadge(prev => prev + 1);
    }
  });

  // ✅ ÄNDERUNG 2: useEffect korrigiert
  useEffect(() => {
    // isFirebaseConfigured ist jetzt eine FUNKTION!
    if (!isFirebaseConfigured() || !auth) {
      console.error('⚠️ Firebase nicht konfiguriert - Auth State Listener nicht aktiv')
      return
    }
    
    console.log('🔐 Auth State Listener gestartet')
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserProfile({
          name: user.displayName || user.email?.split('@')[0] || 'TaskRai Nutzer',
          id: user.uid,
          email: user.email || '',
        });
        console.log('✅ User angemeldet:', user.email)
      } else {
        setIsAuthenticated(false);
        setUserProfile(DEFAULT_PROFILE);
        console.log('ℹ️ User abgemeldet')
      }
    });
    return () => {
      console.log('🔐 Auth State Listener beendet')
      unsubscribe()
    }
  }, []);

  // ✅ ÄNDERUNG 3: handleLogin mit googleSignIn() Wrapper
  const handleLogin = async () => {
    setAuthError('')
    console.log('🔐 Login versucht...')
    
    if (!isFirebaseConfigured()) {
      const msg = '❌ Firebase ist nicht konfiguriert. Überprüfe deine Konfiguration!'
      setAuthError(msg)
      console.error(msg)
      return
    }
    
    if (!auth) {
      const msg = '❌ Firebase Auth nicht initialisiert'
      setAuthError(msg)
      console.error(msg)
      return
    }
    
    try {
      console.log('📱 Platform:', isAndroid() ? 'Android/Capacitor' : 'Web')
      
      // ✅ Verwende neuen googleSignIn() Wrapper statt signInWithPopup
      const result = await googleSignIn()
      console.log('✅ Login erfolgreich:', result.user.email)
      setIsAuthenticated(true)
      
      // Versuche FCM Token nach Login
      if (isAndroid()) {
        console.log('📲 Hole Android FCM Token...')
        const androidToken = await getAndroidFCMToken()
        if (androidToken) {
          console.log('✅ Android FCM Token:', androidToken)
        }
      } else {
        console.log('🔔 Requesting Web FCM Token...')
        const fcmToken = await requestFCMToken()
        if (fcmToken) {
          console.log('✅ Web FCM Token:', fcmToken)
        }
      }
      
    } catch (error) {
      const errorMsg = error.message || 'Anmeldung fehlgeschlagen'
      console.error('❌ Login Fehler:', error)
      setAuthError('Anmeldung fehlgeschlagen: ' + errorMsg)
    }
  };

  // ✅ ÄNDERUNG 4: handleLogout korrigiert
  const handleLogout = async () => {
    setAuthError('')
    console.log('🔐 Logout versucht...')
    
    try {
      if (auth) {
        await signOut(auth)
        console.log('✅ Logout erfolgreich')
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('❌ Logout Fehler:', error)
      setAuthError('Logout fehlgeschlagen')
    }
  };

  // Rest des Codes bleibt gleich...
  // (Avatar, addTask, addFriend, etc. Funktionen)

  // Avatar Component
  const Avatar = ({ seed, size = 'md' }) => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'];
    const color = colors[seed?.charCodeAt(0) % 5] || colors[0];
    return <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-bold`}>{seed?.[0]?.toUpperCase()}</div>;
  };

  const addTask = () => {
    if (!newTaskTitle || !newTaskDate) return;
    const newTask = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      date: newTaskDate,
      time: newTaskTime,
      completed: false,
      completedBy: null,
      assignType,
      assignTargetId,
      repeat: newTaskRepeat,
      comments: [],
      subtasks: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskCategory('termin');
    setNewTaskPriority('normal');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setNewTaskTime('');
    setCurrentView('dashboard');
  };

  const addFriend = () => {
    if (!newFriendName) return;
    const newFriend = {
      id: Math.max(...friends.map(f => f.id), 0) + 1,
      name: newFriendName,
      avatar: newFriendName
    };
    setFriends([...friends, newFriend]);
    setNewFriendName('');
  };

  const createGroup = () => {
    if (!newGroupName) return;
    const newGroup = {
      id: Math.max(...groups.map(g => g.id), 0) + 1,
      name: newGroupName,
      memberCount: 1
    };
    setGroups([...groups, newGroup]);
    setNewGroupName('');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedBy: !t.completed ? userProfile.name : null } : t));
  };

  const addSubtask = () => {
    if (!newSubtaskText || !activeTask) return;
    setTasks(tasks.map(t => t.id === activeTask.id ? { ...t, subtasks: [...t.subtasks, { id: Math.max(...t.subtasks.map(s => s.id), 0) + 1, text: newSubtaskText, completed: false }] } : t));
    setNewSubtaskText('');
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) } : t));
  };

  const sendComment = () => {
    if (!chatMessage || !activeTask) return;
    setTasks(tasks.map(t => t.id === activeTask.id ? { ...t, comments: [...t.comments, { id: Math.max(...(t.comments?.length > 0 ? t.comments.map(c => c.id) : [0])), author: userProfile.name, text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] } : t));
    setChatMessage('');
  };

  const getGroupProgress = (groupId) => {
    const groupTasks = tasks.filter(t => t.assignType === 'group' && t.assignTargetId === groupId);
    if (groupTasks.length === 0) return 0;
    return Math.round((groupTasks.filter(t => t.completed).length / groupTasks.length) * 100);
  };

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
            {pushSupported && (
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Push Benachrichtigungen</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{pushPermission || 'Nicht aktiviert'}</p>
                    </div>
                  </div>
                  <button onClick={requestPushPermission} className={`px-4 py-2 rounded-lg text-sm font-semibold ${pushPermission === 'granted' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' : 'bg-blue-600 text-white'}`}>{pushPermission === 'granted' ? 'Aktiviert' : 'Aktivieren'}</button>
                </div>
                {pushToken && <p className="text-xs text-gray-500 dark:text-gray-400 break-all">Token: {pushToken.substring(0, 20)}...</p>}
              </div>
            )}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Moon size={20} />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Dunkler Modus</span>
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck size={20} />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Datenschutz</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Deine Daten sind verschlüsselt und sicher.</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 group" onClick={handleLogout}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                  <LogOut size={20} />
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">Abmelden</span>
              </div>
            </div>
        </div>
    </div>
  );

  const DashboardView = () => (
    <div className="pb-24 pt-6 px-4">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hallo, {userProfile.name.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Heute sind {tasks.filter(t => t.date === new Date().toISOString().split('T')[0] && !t.completed).length} offene Aufgaben</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentView('settings')} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Settings size={24} className="text-gray-600 dark:text-gray-300" /></button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{isDarkMode ? <Sun size={24} className="text-yellow-500" /> : <Moon size={24} className="text-gray-600" />}</button>
        </div>
      </header>

      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between mb-3"><Flame size={24} /><span className="text-2xl font-bold">{streak} Tage</span></div>
        <p className="text-sm opacity-90">Aktuelle Serie</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <button onClick={() => setDashboardTab('active')} className={`px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${dashboardTab === 'active' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400'}`}>Offen ({tasks.filter(t => !t.completed && t.date <= new Date().toISOString().split('T')[0]).length})</button>
        <button onClick={() => setDashboardTab('today')} className={`px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${dashboardTab === 'today' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400'}`}>Heute ({tasks.filter(t => t.date === new Date().toISOString().split('T')[0]).length})</button>
        <button onClick={() => setDashboardTab('completed')} className={`px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${dashboardTab === 'completed' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400'}`}>Erledigt ({tasks.filter(t => t.completed).length})</button>
      </div>

      <div className="space-y-2 mb-6">
        {(dashboardTab === 'active' ? tasks.filter(t => !t.completed && t.date <= new Date().toISOString().split('T')[0]) : dashboardTab === 'today' ? tasks.filter(t => t.date === new Date().toISOString().split('T')[0]) : tasks.filter(t => t.completed)).map(task => {
          const category = CATEGORIES.find(c => c.id === task.category);
          const priority = PRIORITIES.find(p => p.id === task.priority);
          return (
            <div key={task.id} onClick={() => { setActiveTask(task); setCurrentView('taskDetail'); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${task.completed ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-start gap-3">
                <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'}`}>{task.completed && <Check size={16} className="text-white" />}</button>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${task.completed ? 'text-gray-500 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {category && <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${category.color}`}><category.icon size={12} />{category.label}</span>}
                    {priority && <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${priority.color}`}><priority.icon size={12} />{priority.label}</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.date} {task.time ? `um ${task.time}` : ''}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
        {(dashboardTab === 'active' ? tasks.filter(t => !t.completed && t.date <= new Date().toISOString().split('T')[0]) : dashboardTab === 'today' ? tasks.filter(t => t.date === new Date().toISOString().split('T')[0]) : tasks.filter(t => t.completed)).length === 0 && <p className="text-center text-gray-400 py-6">Keine Aufgaben</p>}
      </div>

      <button onClick={() => setCurrentView('addTask')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20} /> Neue Aufgabe</button>
    </div>
  );

  const TaskDetailView = () => {
    if (!activeTask) return null;
    return (
      <div className="pb-24 pt-6 px-4 h-screen overflow-y-auto">
        <header className="mb-6 flex items-center justify-between">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><ArrowLeft size={24} /></button>
          <h1 className="flex-1 ml-2 text-xl font-bold text-gray-900 dark:text-white">{activeTask.title}</h1>
          <button onClick={() => { deleteTask(activeTask.id); setCurrentView('dashboard'); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-600 dark:text-red-400"><Trash2 size={24} /></button>
        </header>
        <div className="space-y-4 mb-6">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Kategorie</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{CATEGORIES.find(c => c.id === activeTask.category)?.label}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Priorität</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{PRIORITIES.find(p => p.id === activeTask.priority)?.label}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Datum & Zeit</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{activeTask.date} {activeTask.time ? `um ${activeTask.time}` : ''}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Status</p>
            <div className="flex items-center gap-2"><button onClick={() => toggleTask(activeTask.id); setActiveTask({...activeTask, completed: !activeTask.completed});} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${activeTask.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>{activeTask.completed && <Check size={16} className="text-white" />}</button><span className="text-gray-900 dark:text-white">{activeTask.completed ? 'Erledigt' : 'Offen'}</span></div>
          </div>
        </div>
        <div className="mb-20">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Teilaufgaben</h3>
          <div className="space-y-2 mb-4">
            {activeTask.subtasks?.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <button onClick={() => toggleSubtask(activeTask.id, s.id)} className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>{s.completed && <Check size={14} className="text-white" />}</button>
                <span className={`flex-1 ${s.completed ? 'text-gray-500 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>{s.text}</span>
              </div>
            ))}
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

  const Navigation = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button onClick={() => setCurrentView('dashboard')} className={`flex-1 py-4 flex flex-col items-center gap-2 text-sm font-semibold transition-all ${currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}><ListTodo size={24} />Aufgaben</button>
        <button onClick={() => setCurrentView('groups')} className={`flex-1 py-4 flex flex-col items-center gap-2 text-sm font-semibold transition-all ${currentView === 'groups' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}><Users size={24} />Gruppen</button>
        <button onClick={() => setCurrentView('friends')} className={`flex-1 py-4 flex flex-col items-center gap-2 text-sm font-semibold transition-all ${currentView === 'friends' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}><User size={24} />Freunde</button>
      </div>
    </nav>
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
