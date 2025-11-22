import React, { useState } from 'react';
import { createFamily, getProfile } from '../services/api';
import { Loader2, Baby, ArrowRight, Heart, Calendar, User, Type } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  onComplete: () => void;
}

const ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Create Form State
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [gender, setGender] = useState('girl');

  // Join Form State
  const [familyId, setFamilyId] = useState('');
  const [joinParentName, setJoinParentName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim() || !parentName.trim() || !birthDate) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await createFamily({ babyName, birthDate, gender });
      localStorage.setItem('familyId', result.familyId);
      localStorage.setItem('parentName', parentName); // Store locally
      onComplete();
    } catch (err) {
      console.error(err);
      setError(t('onboarding.error_create'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId.trim() || !joinParentName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Verify ID by trying to fetch profile with it
      localStorage.setItem('familyId', familyId);
      const profile = await getProfile();
      
      if (profile) {
        localStorage.setItem('parentName', joinParentName); // Store locally
        onComplete();
      } else {
        localStorage.removeItem('familyId');
        setError(t('onboarding.error_join'));
      }
    } catch (err) {
      localStorage.removeItem('familyId');
      setError(t('onboarding.connection_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-rose-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-100 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Baby size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('onboarding.title')}</h1>
          <p className="text-gray-500">{t('onboarding.subtitle')}</p>
        </div>

        <div className="relative z-10">
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'create' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('onboarding.new_family')}
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'join' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('onboarding.join_existing')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('onboarding.baby_details')}</label>
                <div className="space-y-3">
                    <div className="relative">
                        <input
                        type="text"
                        value={babyName}
                        onChange={(e) => setBabyName(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none pl-10"
                        placeholder={t('onboarding.baby_name_placeholder')}
                        required
                        />
                        <Baby className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                    
                    <div className="relative">
                        <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none pl-10 text-gray-700"
                        required
                        />
                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>

                    <div className="flex gap-2">
                        {['girl', 'boy', 'other'].map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGender(g)}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize border-2 ${
                                    gender === g 
                                    ? 'border-rose-400 bg-rose-50 text-rose-600' 
                                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {t(`common.${g}`)}
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="pt-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{t('onboarding.your_identity')}</label>
                 <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                    {ROLES.map(role => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => setParentName(role)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${
                                parentName === role 
                                ? 'bg-rose-100 text-rose-600 border-rose-200' 
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                 </div>
                 <div className="relative">
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none pl-10"
                      placeholder={t('onboarding.identity_placeholder')}
                      required
                    />
                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                 </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Heart size={20} fill="currentColor" />}
                {t('onboarding.create_btn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.family_id_label')}</label>
                <input
                  type="text"
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none font-mono text-sm"
                  placeholder={t('onboarding.family_id_placeholder')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.your_name_label')}</label>
                <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                    {ROLES.map(role => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => setJoinParentName(role)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${
                                joinParentName === role 
                                ? 'bg-rose-100 text-rose-600 border-rose-200' 
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                 </div>
                <input
                  type="text"
                  value={joinParentName}
                  onChange={(e) => setJoinParentName(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none"
                  placeholder={t('onboarding.your_name_placeholder')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                {t('onboarding.join_btn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
