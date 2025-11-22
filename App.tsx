import React, { useEffect, useState, useCallback } from 'react';
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
import { Baby, Edit2, Save, Copy } from 'lucide-react';

const PARENT_ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];
const PAGE_SIZE = 10;

function App() {
  const { t, language, setLanguage, locale } = useTranslation();

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
          // Deduplicate by ID just in case
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
      window.location.reload(); // Simple reload to clear state
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
    if(language === 'en') return years > 0 ? `${years}y ${remainingMonths}m` : `${months} months`;
    return `${months}m`; // Simplified
  };

  // Filters
  const years = Array.from({length: 5}, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString());

  if (!familyId) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Tabs definition
  const tabs = [
    { key: 'timeline', title: t('nav.home'), icon: <AppOutline /> },
    { key: 'growth', title: t('nav.growth'), icon: <HistogramOutline /> },
    { key: 'settings', title: t('nav.settings'), icon: <SetOutline /> },
  ];

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col">
        {/* Header Area */}
        <div className="bg-white pt-safe-top pb-2 px-4 rounded-b-3xl shadow-sm z-10 sticky top-0">
            <div className="flex items-center gap-3 py-3">
                <Image 
                  src={profile?.photoUrl || ''} 
                  width={48} 
                  height={48} 
                  style={{ borderRadius: '50%' }} 
                  fit='cover'
                  fallback={
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Baby size={24} className="text-gray-400"/>
                    </div>
                  }
                />
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-800">{profile?.name || 'Baby'}</h1>
                    <p className="text-rose-500 text-xs font-medium">{profile && calculateAge(profile.birthDate)}</p>
                </div>
                {currentView === 'timeline' && (
                    <Button size='mini' shape='rounded' onClick={() => setShowFilters(true)}>
                        <FilterOutline fontSize={16} />
                    </Button>
                )}
            </div>
            {profile && (
                <div className="flex gap-2 mb-2">
                     <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-lg font-bold">{profile.currentHeight} cm</span>
                     <span className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-lg font-bold">{profile.currentWeight} kg</span>
                </div>
            )}
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
            <PullToRefresh onRefresh={async () => { 
                setEvents([]); 
                setHasMore(true);
                await loadMore(); 
            }}>
                
                {currentView === 'timeline' && (
                    <div className="p-4 space-y-4">
                         {/* AI Insight Card */}
                         {aiInsight && !loading && filterYear === 'all' && (
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                                <Baby size={80} className="absolute -right-4 -top-4 opacity-20" />
                                <h3 className="font-bold text-indigo-100 text-xs uppercase mb-1">{t('timeline.ai_insight_title')}</h3>
                                <div className="text-sm opacity-90 whitespace-pre-wrap">{aiInsight}</div>
                            </div>
                        )}

                        {events.map(event => (
                            <TimelineItem key={event.id} event={event} />
                        ))}
                        <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
                             <span className="text-xs text-gray-400">{hasMore ? 'Loading...' : t('timeline.end_of_timeline')}</span>
                        </InfiniteScroll>
                    </div>
                )}

                {currentView === 'growth' && (
                     <div className="p-4">
                        <GrowthChart events={events} />
                     </div>
                )}

                {currentView === 'settings' && (
                    <div className="p-4 space-y-4">
                        <List header={t('settings.language')} mode='card'>
                             <List.Item>
                                 <Selector 
                                    options={[
                                        { label: 'En', value: 'en' },
                                        { label: '中文', value: 'zh' },
                                        { label: '日本語', value: 'ja' },
                                        { label: '한국어', value: 'ko' }
                                    ]}
                                    value={[language]}
                                    onChange={v => v.length && setLanguage(v[0] as Language)}
                                 />
                             </List.Item>
                        </List>

                        <List header={t('settings.baby_profile')} mode='card'>
                            <List.Item 
                                extra={!isEditingProfile && <Edit2 size={16} onClick={() => setIsEditingProfile(true)} />}
                                title={t('settings.name')}
                            >
                                {isEditingProfile ? (
                                    <div className="flex gap-2">
                                        <Input value={editName} onChange={setEditName} />
                                        <Button size='mini' color='primary' onClick={handleSaveProfile}><Save size={14}/></Button>
                                    </div>
                                ) : profile?.name}
                            </List.Item>
                        </List>

                        <List header={t('settings.my_identity')} mode='card'>
                             <List.Item title={t('settings.display_name')}>
                                 <div className="flex gap-2 items-center mb-2">
                                     <Input value={editMyName} onChange={setEditMyName} />
                                     <Button size='mini' color='primary' onClick={handleSaveMyIdentity}><Save size={14}/></Button>
                                 </div>
                                 <div className="flex gap-2 overflow-x-auto">
                                     {PARENT_ROLES.map(role => (
                                         <Button key={role} size='mini' onClick={() => setEditMyName(role)} shape='rounded'>
                                             {role}
                                         </Button>
                                     ))}
                                 </div>
                             </List.Item>
                        </List>

                        <List header={t('settings.family_connection')} mode='card'>
                             <List.Item title={t('settings.family_id_label')} description={t('settings.share_hint')}>
                                 <div className="flex justify-between items-center">
                                     <code className="text-xs bg-gray-100 p-1 rounded select-all">{familyId}</code>
                                     <Button size='mini' onClick={handleCopyId}><Copy size={14}/></Button>
                                 </div>
                             </List.Item>
                             <List.Item onClick={handleLogout} arrow={false}>
                                 <span className="text-red-500 font-bold">{t('settings.logout')}</span>
                             </List.Item>
                        </List>
                    </div>
                )}

            </PullToRefresh>
        </div>

        {/* Add Button FAB */}
        <div className="fixed bottom-20 right-4 z-20">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition"
                aria-label="Add Record"
            >
                <AddOutline fontSize={32} />
            </button>
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe-bottom z-10">
            <TabBar activeKey={currentView} onChange={setCurrentView}>
                {tabs.map(item => (
                    <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
                ))}
            </TabBar>
        </div>

        {/* Filters Popup */}
        <Popup
            visible={showFilters}
            onMaskClick={() => setShowFilters(false)}
            onClose={() => setShowFilters(false)}
            bodyStyle={{ height: 'auto', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}
        >
            <div className="p-4 pb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Filters</h3>
                    <Button size='mini' onClick={() => { setFilterYear('all'); setFilterMonth('all'); }}>Clear</Button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-sm font-bold text-gray-500">{t('filters.year')}</p>
                        <Selector
                            options={[{label: 'All', value: 'all'}, ...years.map(y => ({label: y, value: y}))]}
                            value={[filterYear]}
                            onChange={v => v.length && setFilterYear(v[0])}
                            columns={4}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-bold text-gray-500">{t('filters.month')}</p>
                        <Selector
                            options={[{label: 'All', value: 'all'}, ...months.map(m => ({label: m, value: m}))]}
                            value={[filterMonth]}
                            onChange={v => v.length && setFilterMonth(v[0])}
                            columns={6}
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