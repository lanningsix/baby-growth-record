import React, { useState } from 'react';
import { createFamily, getProfile } from '../services/api';
import { Loader2, Baby, ArrowRight, Heart } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await createFamily(familyName);
      localStorage.setItem('familyId', result.familyId);
      onComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to create family. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Verify ID by trying to fetch profile with it
      localStorage.setItem('familyId', familyId);
      const profile = await getProfile();
      
      if (profile) {
        onComplete();
      } else {
        localStorage.removeItem('familyId');
        setError('Invalid Family ID. Could not find a family.');
      }
    } catch (err) {
      localStorage.removeItem('familyId');
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-100 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Baby size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">LittleSteps</h1>
          <p className="text-gray-500">Start your baby's digital journal</p>
        </div>

        <div className="relative z-10">
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'create' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              New Family
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'join' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Existing ID
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Baby or Family Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none"
                  placeholder="e.g. The Smiths or Baby Leo"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Heart size={20} fill="currentColor" />}
                Create Family
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Family ID</label>
                <input
                  type="text"
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-rose-200 outline-none font-mono text-sm"
                  placeholder="UUID string"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                Join Family
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;