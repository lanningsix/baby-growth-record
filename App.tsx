import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getTimeline, getProfile, addRecord, getMilestoneAdvice, updateProfile } from './services/api';
import { TimelineEvent, BabyProfile } from './types';
import TimelineItem from './components/TimelineItem';
import AddRecordModal from './components/AddRecordModal';
import GrowthChart from './components/GrowthChart';
import Onboarding from './components/Onboarding';
import ImageViewer from './components/ImageViewer';
import { Plus, Home, LineChart, Settings, Users, Baby, LogOut, Copy, Check, Edit2, Save, User, Filter, Calendar, Loader2, RefreshCw } from 'lucide-react';

const PARENT_ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];
const PAGE_SIZE = 10;

function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'timeline' | 'growth' | 'settings'>('timeline');

  // Data State
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [myIdentity, setMyIdentity] = useState<string>('Mom');
  
  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Image Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Settings Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editMyName, setEditMyName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('familyId');
    const storedName = localStorage.getItem('parentName');
    
    if (storedName) setMyIdentity(storedName);
    if (editMyName === '') setEditMyName(storedName || '');

    if (storedId) {
      setFamilyId(storedId);
      // Profile is needed for onboarding/settings, fetch once
      getProfile().then(p => {
          setProfile(p);
          if(p) {
            setEditName(p.name);
            setEditDob(p.birthDate);
            const ageMonths = Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            getMilestoneAdvice(ageMonths).then(setAiInsight);
          }
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Reset pagination when filters or view changes
  useEffect(() => {
      if(familyId) {
          setPage(1);
          setEvents([]);
          setHasMore(true);
          fetchEvents(1, true);
      }
  }, [familyId, filterYear, filterMonth, filterDay]);

  const fetchEvents = async (pageNum: number, reset = false) => {
    if (!familyId) return;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const filters = {
          year: filterYear !== 'all' ? filterYear : undefined,
          month: filterMonth !== 'all' ? filterMonth : undefined,
          day: filterDay !== 'all' ? filterDay : undefined,
      };

      const newEvents = await getTimeline(pageNum, PAGE_SIZE, filters);
      
      if (newEvents.length < PAGE_SIZE) {
          setHasMore(false);
      }

      setEvents(prev => reset ? newEvents : [...prev, ...newEvents]);
    } catch (error) {
      console.error("Failed to load timeline", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => {
              const nextPage = prev + 1;
              fetchEvents(nextPage);
              return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);


  const handleOnboardingComplete = () => {
    const storedId = localStorage.getItem('familyId');
    const storedName = localStorage.getItem('parentName');
    if (storedName) setMyIdentity(storedName);
    if (storedId) {
      setFamilyId(storedId);
      // Triggers existing useEffect
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('familyId');
    localStorage.removeItem('parentName');
    setFamilyId(null);
    setProfile(null);
    setEvents([]);
  };

  const handleCopyId = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveRecord = async (recordData: any) => {
    // Optimistic or just refresh top? 
    // Since we have pagination, appending to top is safest if we are on page 1.
    // If we are filtered, we should maybe reload.
    const newRecord = await addRecord(recordData);
    
    // If currently showing all or matching filter, add to top
    setEvents(prev => [newRecord, ...prev]);
    
    if (recordData.type === 'GROWTH') {
      const p = await getProfile();
      setProfile(p);
    }
  };

  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      try {
          await updateProfile({
              name: editName,
              birthDate: editDob
          });
          if(profile) {
              setProfile({...profile, name: editName, birthDate: editDob});
          }
          setIsEditingProfile(false);
      } catch (e) {
          alert("Failed to save profile.");
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleSaveMyIdentity = () => {
      if(editMyName.trim()) {
          localStorage.setItem('parentName', editMyName);
          setMyIdentity(editMyName);
          alert("Identity updated!");
      }
  };

  const calculateAge = (birthDate: string) => {
    const diff = new Date().getTime() - new Date(birthDate).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return years > 0 ? `${years}y ${remainingMonths}m` : `${months} months`;
  };

  // Helpers for filters
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i); // Last 5 years
  const months = Array.from({length: 12}, (_, i) => i + 1);
  const days = Array.from({length: 31}, (_, i) => i + 1);

  const resetFilters = () => {
      setFilterYear('all');
      setFilterMonth('all');
      setFilterDay('all');
  };

  if (!familyId) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-bounce text-4xl">👶</div>
            <p className="text-rose-400 font-semibold animate-pulse">Loading LittleSteps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 pb-24 md:pb-0 md:pl-20">
      
      {/* Desktop Navigation Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white shadow-lg flex-col items-center py-8 gap-8 z-40">
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <Baby />
        </div>
        <nav className="flex flex-col gap-6">
            <button onClick={() => setCurrentView('timeline')} className={`p-3 rounded-xl transition ${currentView === 'timeline' ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <Home size={24} />
            </button>
            <button onClick={() => setCurrentView('growth')} className={`p-3 rounded-xl transition ${currentView === 'growth' ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <LineChart size={24} />
            </button>
            <button onClick={() => setCurrentView('settings')} className={`p-3 rounded-xl transition ${currentView === 'settings' ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <Settings size={24} />
            </button>
        </nav>
        <div className="mt-auto">
           <button onClick={handleLogout} className="p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition">
              <LogOut size={24} />
           </button>
        </div>
      </div>

      {/* Mobile Header / Profile Summary */}
      <div className="bg-white pt-6 pb-6 px-6 rounded-b-[40px] shadow-sm mb-6 sticky top-0 z-30">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-rose-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl relative shrink-0">
             {profile?.photoUrl ? <img src={profile.photoUrl} className="w-full h-full object-cover" alt="baby"/> : "👶"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{profile?.name}</h1>
                    <p className="text-rose-500 font-medium text-xs md:text-sm">{profile && calculateAge(profile.birthDate)} old</p>
                </div>
                
                {currentView === 'timeline' && (
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition ${showFilters ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}
                    >
                        <Filter size={20} />
                    </button>
                )}
            </div>
            
            <div className="flex gap-3 mt-2">
                <div className="bg-blue-50 px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold text-blue-600 whitespace-nowrap">
                    {profile?.currentHeight} cm
                </div>
                <div className="bg-purple-50 px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold text-purple-600 whitespace-nowrap">
                    {profile?.currentWeight} kg
                </div>
            </div>
          </div>
        </div>
        
        {/* Expandable Filters */}
        {showFilters && currentView === 'timeline' && (
            <div className="max-w-3xl mx-auto mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap gap-2 items-center">
                    <select 
                        value={filterYear} 
                        onChange={e => setFilterYear(e.target.value)}
                        className="bg-gray-50 text-sm p-2 rounded-lg border-none outline-none font-semibold text-gray-600"
                    >
                        <option value="all">Year: All</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select 
                        value={filterMonth} 
                        onChange={e => setFilterMonth(e.target.value)}
                        className="bg-gray-50 text-sm p-2 rounded-lg border-none outline-none font-semibold text-gray-600"
                    >
                        <option value="all">Month: All</option>
                        {months.map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', {month: 'short'})}</option>)}
                    </select>

                    <select 
                        value={filterDay} 
                        onChange={e => setFilterDay(e.target.value)}
                        className="bg-gray-50 text-sm p-2 rounded-lg border-none outline-none font-semibold text-gray-600"
                    >
                        <option value="all">Day: All</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <button onClick={resetFilters} className="ml-auto p-2 text-gray-400 hover:text-rose-500">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 min-h-[50vh]">
        
        {currentView === 'timeline' && (
          <div className="space-y-2 pb-20">
            {/* AI Insight only shows on page 1 and no filters active */}
             {aiInsight && page === 1 && filterYear === 'all' && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Baby size={100} />
                    </div>
                    <h3 className="font-bold mb-2 text-indigo-100 uppercase tracking-wider text-xs">AI Development Tracker</h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                    {aiInsight.split('\n').map((line, i) => (
                        <p key={i} className="mb-1">{line.replace('*', '•')}</p>
                    ))}
                    </div>
                </div>
            )}

             <h2 className="text-lg font-bold text-gray-700 mb-4 ml-2">Timeline</h2>
            
            {events.length === 0 && !loading ? (
               <div className="text-center py-10 text-gray-400">
                 <p>No memories found.</p>
                 {(filterYear !== 'all' || filterMonth !== 'all' || filterDay !== 'all') && (
                     <button onClick={resetFilters} className="text-rose-500 font-bold mt-2 text-sm">Clear Filters</button>
                 )}
               </div>
            ) : (
               events.map(event => (
                 <TimelineItem 
                    key={event.id} 
                    event={event} 
                    onImageClick={(id) => {
                        setSelectedEventId(id);
                        setViewerOpen(true);
                    }}
                 />
               ))
            )}

            {/* Infinite Scroll Loader */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center w-full">
                 {loadingMore && <Loader2 className="animate-spin text-rose-400" />}
                 {!hasMore && events.length > 0 && <span className="text-xs text-gray-300 font-medium">End of timeline</span>}
            </div>
          </div>
        )}

        {currentView === 'growth' && (
           <div className="pb-20">
               <h2 className="text-lg font-bold text-gray-700 mb-4">Growth Tracker</h2>
               {/* Pass all events? Ideally endpoint should be separate for growth, but filtering existing works for small apps */}
               <GrowthChart events={events} />
           </div>
        )}

        {currentView === 'settings' && (
            <div className="pb-24 space-y-6">
                
                {/* Baby Profile Settings */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Baby Profile</h2>
                        {!isEditingProfile ? (
                            <button onClick={() => setIsEditingProfile(true)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition">
                                <Edit2 size={18} />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingProfile(false)} className="px-3 py-1 text-sm text-gray-500">Cancel</button>
                                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-3 py-1 bg-rose-500 text-white text-sm rounded-lg shadow-sm">
                                    {isSavingProfile ? "Saving..." : "Save"}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Name</label>
                            {isEditingProfile ? (
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200" />
                            ) : (
                                <p className="text-lg font-medium text-gray-700">{profile?.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                             {isEditingProfile ? (
                                <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200" />
                            ) : (
                                <p className="text-gray-700 font-mono">{profile?.birthDate.split('T')[0]}</p>
                            )}
                        </div>
                    </div>
                </div>

                 {/* Parent / User Settings */}
                 <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">My Identity</h2>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                        <div className="flex gap-4 items-start">
                             <div className="p-3 bg-blue-100 text-blue-600 rounded-full mt-1"><User size={24}/></div>
                             <div className="flex-1">
                                 <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Display Name</label>
                                 
                                 {/* Quick Select Chips */}
                                 <div className="flex gap-2 mb-3 flex-wrap">
                                    {PARENT_ROLES.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setEditMyName(role)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                                editMyName === role 
                                                ? 'bg-blue-500 text-white border-blue-500' 
                                                : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                 </div>

                                 <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editMyName} 
                                        onChange={e => setEditMyName(e.target.value)}
                                        placeholder="Custom name..."
                                        className="flex-1 bg-white border border-blue-100 rounded-lg p-2 text-gray-800 font-semibold focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                    <button onClick={handleSaveMyIdentity} className="bg-blue-500 text-white p-2 rounded-lg shadow-sm hover:bg-blue-600">
                                        <Save size={18} />
                                    </button>
                                 </div>
                                 <p className="text-xs text-blue-400 mt-2">This name will appear on memory cards you create.</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Family Settings */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-6">Family Connection</h2>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Your Family ID</p>
                            <div className="flex items-center justify-between">
                                <code className="text-sm font-mono bg-white px-2 py-1 rounded border text-gray-600 truncate max-w-[200px]">{familyId}</code>
                                <button onClick={handleCopyId} className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-sm font-bold">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Share this ID with family members to let them join.</p>
                        </div>

                        <button 
                          onClick={handleLogout}
                          className="w-full py-3 border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
                        >
                          Log Out / Switch Family
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Floating Action Button (Mobile & Desktop) */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl shadow-gray-500/40 flex items-center justify-center hover:scale-110 transition duration-200 z-30"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around py-4 pb-8 z-20">
         <button onClick={() => setCurrentView('timeline')} className={`flex flex-col items-center gap-1 ${currentView === 'timeline' ? 'text-rose-500' : 'text-gray-400'}`}>
            <Home size={24} fill={currentView === 'timeline' ? "currentColor" : "none"} />
            <span className="text-[10px] font-bold">Home</span>
         </button>
         <button onClick={() => setCurrentView('growth')} className={`flex flex-col items-center gap-1 ${currentView === 'growth' ? 'text-rose-500' : 'text-gray-400'}`}>
            <LineChart size={24} />
            <span className="text-[10px] font-bold">Growth</span>
         </button>
         <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-rose-500' : 'text-gray-400'}`}>
            <Settings size={24} />
            <span className="text-[10px] font-bold">Settings</span>
         </button>
      </div>

      <AddRecordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRecord}
        authorName={myIdentity}
      />
      
      <ImageViewer 
         isOpen={viewerOpen}
         onClose={() => setViewerOpen(false)}
         initialEventId={selectedEventId}
         events={events} // Pass current list for navigation
      />

    </div>
  );
}

export default App;