import React, { useEffect, useState } from 'react';
import { getTimeline, getProfile, addRecord, getMilestoneAdvice, updateProfile } from './services/api';
import { TimelineEvent, BabyProfile } from './types';
import TimelineItem from './components/TimelineItem';
import AddRecordModal from './components/AddRecordModal';
import GrowthChart from './components/GrowthChart';
import Onboarding from './components/Onboarding';
import { useTranslation, Language } from './i18n';
import { 
    TabBar, 
    InfiniteScroll, 
    Popup, 
    Button, 
    Selector, 
    PullToRefresh,
    Image,
    List,
    Input,
    Dialog,
    Toast
} from 'antd-mobile';
import { 
    AppOutline, 
    HistogramOutline, 
    SetOutline, 
    FilterOutline,
    AddOutline
} from 'antd-mobile-icons';
import { Baby, Edit2, Save, Copy, Sparkles } from 'lucide-react';

const PARENT_ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];
const PAGE_SIZE = 10;

function App() {
  const { t, language, setLanguage } = useTranslation();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('timeline');

  // Data State
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [myIdentity, setMyIdentity] = useState<string>('Mom');
  
  // Pagination & Filtering State
  const [hasMore, setHasMore] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Settings Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMyName, setEditMyName] = useState('');

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('familyId');
    const storedName = localStorage.getItem('parentName');
    
    if (storedName) setMyIdentity(storedName);
    if (editMyName === '') setEditMyName(storedName || '');

    if (storedId) {
      setFamilyId(storedId);
      getProfile().then(p => {
          setProfile(p);
          if(p) {
            setEditName(p.name);
            const ageMonths = Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
            getMilestoneAdvice(ageMonths, language).then(setAiInsight);
          }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [language]);

  // Reset pagination when filters changes
  useEffect(() => {
      if(familyId && currentView === 'timeline') {
          setEvents([]);
          setHasMore(true);
          loadMore();
      }
  }, [familyId, filterYear, filterMonth]);

  const loadMore = async () => {
    if (!familyId) return;
    const nextPage = Math.ceil(events.length / PAGE_SIZE) + 1;
    
    try {
      const filters = {
          year: filterYear !== 'all' ? filterYear : undefined,
          month: filterMonth !== 'all' ? filterMonth : undefined,
      };

      const newEvents = await getTimeline(nextPage, PAGE_SIZE, filters);
      
      if (newEvents.length < PAGE_SIZE) {
          setHasMore(false);
      }
      
      setEvents(val => {
          const existingIds = new Set(val.map(e => e.id));
          const uniqueNew = newEvents.filter(e => !existingIds.has(e.id));
          return [...val, ...uniqueNew];
      });
      
    } catch (error) {
      setHasMore(false);
    }
  };

  const handleOnboardingComplete = () => {
    const storedId = localStorage.getItem('familyId');
    const storedName = localStorage.getItem('parentName');
    if (storedName) setMyIdentity(storedName);
    if (storedId) {
      setFamilyId(storedId);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    Dialog.confirm({
        content: t('settings.logout'),
        onConfirm: () => {
            localStorage.removeItem('familyId');
            localStorage.removeItem('parentName');
            setFamilyId(null);
            setProfile(null);
            setEvents([]);
        }
    })
  };

  const handleCopyId = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      Toast.show({ icon: 'success', content: t('common.copied') });
    }
  };

  const handleSaveRecord = async (recordData: any) => {
    try {
        const newRecord = await addRecord(recordData);
        setEvents(prev => {
            const updated = [newRecord, ...prev];
            return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        if (recordData.type === 'GROWTH') {
            const p = await getProfile();
            setProfile(p);
        }
    } catch (e) {
        console.error("Failed to save record:", e);
        Toast.show({ icon: 'fail', content: 'Failed to save' });
    }
  };

  const handleSaveProfile = async () => {
      try {
          await updateProfile({ name: editName });
          if(profile) setProfile({...profile, name: editName});
          setIsEditingProfile(false);
          Toast.show({icon: 'success', content: t('common.save')});
      } catch (e) {
          Toast.show({icon: 'fail', content: 'Error'});
      }
  };

  const handleSaveMyIdentity = () => {
      if(editMyName.trim()) {
          localStorage.setItem('parentName', editMyName);
          setMyIdentity(editMyName);
          Toast.show({icon: 'success', content: 'Updated'});
      }
  };

  const calculateAge = (birthDate: string) => {
    const diff = new Date().getTime() - new Date(birthDate).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if(language === 'en') return years > 0 ? `${years}y ${remainingMonths}m` : `${months} months old`;
    return `${months}m`;
  };

  const years = Array.from({length: 5}, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString());

  if (!familyId) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const tabs = [
    { key: 'timeline', title: t('nav.home'), icon: <AppOutline /> },
    { key: 'growth', title: t('nav.growth'), icon: <HistogramOutline /> },
    { key: 'settings', title: t('nav.settings'), icon: <SetOutline /> },
  ];

  return (
    <div className="min-h-screen bg-[#fff1f2] flex flex-col font-sans text-slate-800">
        {/* Header */}
        <div className="relative z-20 bg-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.15)] rounded-b-[40px] overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-pink-50 to-white opacity-60"></div>
             
             <div className="relative px-6 pt-safe-top pb-6">
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-200 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition"></div>
                        <Image 
                          src={profile?.photoUrl || ''} 
                          width={64} 
                          height={64} 
                          style={{ borderRadius: '50%', border: '4px solid white' }} 
                          fit='cover'
                          className="relative z-10 shadow-md"
                          fallback={
                            <div className="w-16 h-16 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-md text-rose-300">
                                <Baby size={32} strokeWidth={1.5} />
                            </div>
                          }
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-extrabold text-gray-800 truncate pr-2">{profile?.name || 'Baby'}</h1>
                            {currentView === 'timeline' && (
                                <button 
                                    onClick={() => setShowFilters(true)}
                                    className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-rose-500 active:scale-95 transition"
                                >
                                    <FilterOutline fontSize={18} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-rose-500/10 text-rose-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                               {profile && calculateAge(profile.birthDate)}
                            </span>
                            {profile && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs font-bold text-gray-500">{profile.currentHeight}cm</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs font-bold text-gray-500">{profile.currentWeight}kg</span>
                              </>
                            )}
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
            <PullToRefresh onRefresh={async () => { 
                setEvents([]); 
                setHasMore(true);
                await loadMore(); 
            }}>
                
                {currentView === 'timeline' && (
                    <div className="px-5 pt-8 pb-10 space-y-6">
                         {/* AI Insight Card */}
                         {aiInsight && !loading && filterYear === 'all' && (
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden animate-fade-in mb-8">
                                <Sparkles size={120} className="absolute -right-6 -top-10 text-white opacity-10 rotate-12" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                                            <Sparkles size={16} className="text-yellow-300" fill="currentColor" />
                                        </div>
                                        <h3 className="font-bold text-indigo-100 text-xs uppercase tracking-widest">{t('timeline.ai_insight_title')}</h3>
                                    </div>
                                    <p className="text-[15px] leading-relaxed font-medium text-indigo-50/90 whitespace-pre-wrap">{aiInsight}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-0">
                            {events.map((event, index) => (
                                <TimelineItem 
                                    key={event.id} 
                                    event={event} 
                                />
                            ))}
                        </div>
                        
                        <div className="py-6">
                             <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
                                 <div className="flex justify-center">
                                     <span className="text-xs text-gray-400 font-bold bg-white/60 px-4 py-1.5 rounded-full backdrop-blur-sm">{hasMore ? 'Loading...' : t('timeline.end_of_timeline')}</span>
                                 </div>
                             </InfiniteScroll>
                        </div>
                    </div>
                )}

                {currentView === 'growth' && (
                     <div className="p-5 pt-8 pb-20">
                        <GrowthChart events={events} />
                     </div>
                )}

                {currentView === 'settings' && (
                    <div className="p-5 pt-8 pb-20 space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-1">{t('settings.language')}</h3>
                             <Selector 
                                options={[
                                    { label: 'English', value: 'en' },
                                    { label: '中文', value: 'zh' },
                                    { label: '日本語', value: 'ja' },
                                    { label: '한국어', value: 'ko' }
                                ]}
                                value={[language]}
                                onChange={v => v.length && setLanguage(v[0] as Language)}
                                style={{ '--border-radius': '16px', '--padding': '10px 20px', '--color': '#f3f4f6', '--checked-color': '#fff1f2', '--checked-border': 'transparent', '--checked-text-color': '#f43f5e' }}
                             />
                        </div>

                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm p-2">
                             <List header={<span className="text-lg font-extrabold text-gray-800 px-2">{t('settings.baby_profile')}</span>}>
                                <List.Item 
                                    extra={!isEditingProfile && <div className="bg-rose-50 text-rose-500 p-2 rounded-full"><Edit2 size={16} onClick={() => setIsEditingProfile(true)} /></div>}
                                    title={<span className="font-bold text-gray-600 text-sm">{t('settings.name')}</span>}
                                    className="rounded-xl hover:bg-gray-50 transition"
                                >
                                    {isEditingProfile ? (
                                        <div className="flex gap-3">
                                            <Input className="bg-gray-50 px-3 py-1 rounded-xl" value={editName} onChange={setEditName} />
                                            <Button size='mini' color='primary' onClick={handleSaveProfile} shape='rounded' className="!bg-rose-500"><Save size={16}/></Button>
                                        </div>
                                    ) : <span className="text-lg font-bold text-gray-800">{profile?.name}</span>}
                                </List.Item>
                            </List>
                        </div>

                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm p-2">
                            <List header={<span className="text-lg font-extrabold text-gray-800 px-2">{t('settings.my_identity')}</span>}>
                                 <List.Item title={<span className="font-bold text-gray-600 text-sm">{t('settings.display_name')}</span>} className="rounded-xl">
                                     <div className="flex gap-2 items-center mb-4">
                                         <Input className="bg-gray-50 px-3 py-2 rounded-xl font-bold text-gray-800" value={editMyName} onChange={setEditMyName} />
                                         <Button size='small' color='primary' onClick={handleSaveMyIdentity} shape='rounded' className="!bg-rose-500 !border-none shadow-lg shadow-rose-200"><Save size={18}/></Button>
                                     </div>
                                     <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                         {PARENT_ROLES.map(role => (
                                             <button 
                                                key={role} 
                                                onClick={() => setEditMyName(role)} 
                                                className={`px-4 py-2 text-xs rounded-2xl font-bold border transition ${editMyName === role ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200' : 'bg-white text-gray-500 border-gray-100'}`}
                                             >
                                                 {role}
                                             </button>
                                         ))}
                                     </div>
                                 </List.Item>
                            </List>
                        </div>

                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm p-2">
                            <List header={<span className="text-lg font-extrabold text-gray-800 px-2">{t('settings.family_connection')}</span>}>
                                 <List.Item 
                                    title={<span className="font-bold text-gray-600 text-sm">{t('settings.family_id_label')}</span>} 
                                    description={<span className="text-xs text-gray-400 mt-1 block">{t('settings.share_hint')}</span>}
                                    className="rounded-xl"
                                 >
                                     <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl mt-2 border border-gray-100">
                                         <code className="text-xs font-mono text-gray-600 select-all break-all">{familyId}</code>
                                         <div className="pl-4 cursor-pointer hover:text-rose-500 transition" onClick={handleCopyId}>
                                            <Copy size={18} />
                                         </div>
                                     </div>
                                 </List.Item>
                                 <List.Item onClick={handleLogout} arrow={false} className="rounded-xl hover:bg-red-50 transition mt-2">
                                     <span className="text-red-500 font-bold flex items-center justify-center py-2">{t('settings.logout')}</span>
                                 </List.Item>
                            </List>
                        </div>
                    </div>
                )}

            </PullToRefresh>
        </div>

        {/* Floating FAB */}
        <div className="fixed bottom-28 right-6 z-40 animate-fade-in">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-16 h-16 bg-rose-500 text-white rounded-full shadow-[0_10px_30px_rgba(244,63,94,0.4)] flex items-center justify-center active:scale-90 transition-all duration-300 hover:bg-rose-600 hover:-translate-y-1 border-4 border-white/20 backdrop-blur-sm"
                aria-label="Add Record"
            >
                <AddOutline fontSize={32} />
            </button>
        </div>

        {/* Floating Navigation Pill */}
        <div className="fixed bottom-6 left-6 right-6 z-50">
            <div className="bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-full p-2 border border-white/50">
                <TabBar 
                    activeKey={currentView} 
                    onChange={setCurrentView} 
                    className="floating-tab-bar"
                    safeArea
                >
                    {tabs.map(item => (
                        <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
                    ))}
                </TabBar>
            </div>
        </div>

        {/* Filters Popup */}
        <Popup
            visible={showFilters}
            onMaskClick={() => setShowFilters(false)}
            onClose={() => setShowFilters(false)}
            bodyStyle={{ borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }}
        >
            <div className="p-8 pb-12 bg-white">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-extrabold text-2xl text-gray-800">Filters</h3>
                    <Button size='small' fill='none' shape='rounded' onClick={() => { setFilterYear('all'); setFilterMonth('all'); }} className="text-rose-500 font-bold bg-rose-50">
                        Clear
                    </Button>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <p className="mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('filters.year')}</p>
                        <Selector
                            options={[{label: 'All', value: 'all'}, ...years.map(y => ({label: y, value: y}))]}
                            value={[filterYear]}
                            onChange={v => v.length && setFilterYear(v[0])}
                            columns={4}
                            style={{ '--border-radius': '16px', '--color': '#f9fafb', '--checked-color': '#fff1f2', '--checked-border': '2px solid #f43f5e', '--checked-text-color': '#f43f5e' }}
                        />
                    </div>
                    <div>
                        <p className="mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('filters.month')}</p>
                        <Selector
                            options={[{label: 'All', value: 'all'}, ...months.map(m => ({label: m, value: m}))]}
                            value={[filterMonth]}
                            onChange={v => v.length && setFilterMonth(v[0])}
                            columns={6}
                            style={{ '--border-radius': '16px', '--color': '#f9fafb', '--checked-color': '#fff1f2', '--checked-border': '2px solid #f43f5e', '--checked-text-color': '#f43f5e' }}
                        />
                    </div>
                </div>
            </div>
        </Popup>

        <AddRecordModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveRecord}
            authorName={myIdentity}
        />
    </div>
  );
}

export default App;