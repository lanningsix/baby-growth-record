import React, { useEffect, useState } from 'react';
import { getTimeline, getProfile, addRecord } from './services/mockBackend';
import { getMilestoneAdvice } from './services/geminiService';
import { TimelineEvent, BabyProfile } from './types';
import TimelineItem from './components/TimelineItem';
import AddRecordModal from './components/AddRecordModal';
import GrowthChart from './components/GrowthChart';
import { Plus, Home, LineChart, Settings, Users, Baby } from 'lucide-react';

function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'timeline' | 'growth' | 'settings'>('timeline');

  // Data State
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, profileData] = await Promise.all([
        getTimeline(),
        getProfile()
      ]);
      setEvents(eventsData);
      setProfile(profileData);
      
      // Get simple AI advice based on age
      if(profileData) {
        // Calculate age in months roughly
        const ageMonths = Math.floor((new Date().getTime() - new Date(profileData.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        getMilestoneAdvice(ageMonths).then(setAiInsight);
      }

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (recordData: any) => {
    const newRecord = await addRecord(recordData);
    setEvents(prev => [newRecord, ...prev]);
    
    // Refresh profile if it was a growth record to update header stats
    if (recordData.type === 'GROWTH') {
      const p = await getProfile();
      setProfile(p);
    }
  };

  const calculateAge = (birthDate: string) => {
    const diff = new Date().getTime() - new Date(birthDate).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return years > 0 ? `${years}y ${remainingMonths}m` : `${months} months`;
  };

  if (loading) {
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
      </div>

      {/* Mobile Header / Profile Summary */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm mb-6">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl relative">
             {profile?.photoUrl ? <img src={profile.photoUrl} className="w-full h-full object-cover" alt="baby"/> : "👶"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{profile?.name}</h1>
            <p className="text-rose-500 font-medium text-sm">{profile && calculateAge(profile.birthDate)} old</p>
            <div className="flex gap-4 mt-2">
                <div className="bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold text-blue-600">
                    {profile?.currentHeight} cm
                </div>
                <div className="bg-purple-50 px-3 py-1 rounded-lg text-xs font-bold text-purple-600">
                    {profile?.currentWeight} kg
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4">
        
        {/* AI Insight Card */}
        {currentView === 'timeline' && aiInsight && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Baby size={100} />
                </div>
                <h3 className="font-bold mb-2 text-indigo-100 uppercase tracking-wider text-xs">AI Development Tracker</h3>
                <div className="prose prose-invert prose-sm max-w-none">
                   {/* Simple markdown rendering for the list */}
                   {aiInsight.split('\n').map((line, i) => (
                       <p key={i} className="mb-1">{line.replace('*', '•')}</p>
                   ))}
                </div>
            </div>
        )}

        {currentView === 'timeline' && (
          <div className="space-y-2 pb-20">
             <h2 className="text-lg font-bold text-gray-700 mb-4 ml-2">Timeline</h2>
            {events.map(event => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        )}

        {currentView === 'growth' && (
           <div className="pb-20">
               <h2 className="text-lg font-bold text-gray-700 mb-4">Growth Tracker</h2>
               <GrowthChart events={events} />
           </div>
        )}

        {currentView === 'settings' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Family Settings</h2>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-full"><Users size={20}/></div>
                            <div>
                                <p className="font-bold text-gray-800">Family Sharing</p>
                                <p className="text-sm text-gray-500">Invite grandparents to view updates</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg">Invite</button>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Access List</h3>
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">You</div>
                                <span className="text-gray-700 font-medium">Mom (Admin)</span>
                             </div>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">D</div>
                                <span className="text-gray-700 font-medium">Dad (Admin)</span>
                             </div>
                        </div>
                         <div className="flex items-center justify-between opacity-60">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">G</div>
                                <span className="text-gray-700 font-medium">Grandma (Viewer)</span>
                             </div>
                        </div>
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
            <span className="text-[10px] font-bold">Family</span>
         </button>
      </div>

      <AddRecordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRecord}
      />

    </div>
  );
}

export default App;
