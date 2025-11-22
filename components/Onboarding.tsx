
import React, { useState } from 'react';
import { createFamily, getProfile } from '../services/api';
import { Baby, Heart, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Form, Input, Button, DatePicker, Selector, Toast } from 'antd-mobile';

interface Props {
  onComplete: () => void;
}

const ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);
  
  const [form] = Form.useForm();
  const [joinForm] = Form.useForm();
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleCreate = async (values: any) => {
    setIsLoading(true);
    try {
      const birthDateStr = values.birthDate ? values.birthDate.toISOString() : new Date().toISOString();
      
      const result = await createFamily({ 
          babyName: values.babyName, 
          birthDate: birthDateStr, 
          gender: values.gender[0] 
      });
      
      localStorage.setItem('familyId', result.familyId);
      localStorage.setItem('parentName', values.parentName[0]); 
      onComplete();
    } catch (err) {
      console.error(err);
      Toast.show({ icon: 'fail', content: t('onboarding.error_create') })
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (values: any) => {
    setIsLoading(true);
    try {
      localStorage.setItem('familyId', values.familyId);
      const profile = await getProfile();
      if (profile) {
        localStorage.setItem('parentName', values.joinParentName[0]);
        onComplete();
      } else {
        localStorage.removeItem('familyId');
        Toast.show({ icon: 'fail', content: t('onboarding.error_join') })
      }
    } catch (err) {
      localStorage.removeItem('familyId');
      Toast.show({ icon: 'fail', content: t('onboarding.connection_error') })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fff1f2] overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-200 rounded-full opacity-30 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 -left-20 w-96 h-96 bg-indigo-200 rounded-full opacity-30 blur-[100px] animate-pulse delay-1000"></div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        
        <div className="text-center mb-10">
          <div className="inline-block relative mb-6 group cursor-pointer">
              <div className="absolute inset-0 bg-rose-300 rounded-[2rem] blur-lg opacity-40 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-100 rotate-3 group-hover:rotate-0 transition duration-500 ease-out">
                  <div className="bg-gradient-to-br from-rose-400 to-pink-500 w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white shadow-inner">
                    <Baby size={42} strokeWidth={2} />
                  </div>
              </div>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">{t('onboarding.title')}</h1>
          <p className="text-slate-500 font-semibold text-lg">{t('onboarding.subtitle')}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-white/60 p-2">
            <div className="flex p-1.5 bg-slate-100/50 rounded-[1.8rem] mb-6 border border-white/50">
                <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3.5 text-sm font-bold rounded-[1.4rem] transition-all duration-300 ${
                    activeTab === 'create' ? 'bg-white text-rose-500 shadow-md shadow-rose-100 scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'
                }`}
                >
                {t('onboarding.new_family')}
                </button>
                <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-3.5 text-sm font-bold rounded-[1.4rem] transition-all duration-300 ${
                    activeTab === 'join' ? 'bg-white text-rose-500 shadow-md shadow-rose-100 scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'
                }`}
                >
                {t('onboarding.join_existing')}
                </button>
            </div>

            <div className="px-5 pb-5">
            {activeTab === 'create' ? (
                <Form 
                    form={form} 
                    onFinish={handleCreate} 
                    layout='horizontal'
                    className="onboarding-form"
                    footer={
                        <Button block type='submit' color='primary' size='large' loading={isLoading} shape="rounded" 
                            className="!bg-rose-500 !border-none shadow-xl shadow-rose-200 !h-14 !text-lg !font-bold mt-6 hover:!bg-rose-600 transition-colors">
                            {t('onboarding.create_btn')} <ArrowRight size={20} className="ml-2 inline" strokeWidth={2.5} />
                        </Button>
                    }
                    initialValues={{ gender: ['girl'], parentName: ['Mom'] }}
                >
                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 pl-2 tracking-wider">{t('onboarding.baby_details')}</div>
                    <Form.Item name='babyName' rules={[{ required: true }]}>
                        <Input placeholder={t('onboarding.baby_name_placeholder')} className="!bg-white !rounded-2xl !px-4 !py-3 !text-lg font-bold shadow-sm border border-slate-100" />
                    </Form.Item>
                    
                    <Form.Item 
                        name='birthDate' 
                        trigger='onConfirm' 
                        onClick={() => setDatePickerVisible(true)}
                        rules={[{ required: true }]}
                    >
                        <DatePicker
                            visible={datePickerVisible}
                            onClose={() => setDatePickerVisible(false)}
                            max={new Date()}
                        >
                            {value => (
                                <div className="bg-white rounded-2xl px-4 py-3.5 text-slate-700 flex items-center justify-between cursor-pointer shadow-sm border border-slate-100 font-bold">
                                    <span className={!value ? 'text-slate-300' : ''}>
                                        {value?.toLocaleDateString() || t('settings.dob')}
                                    </span>
                                </div>
                            )}
                        </DatePicker>
                    </Form.Item>

                    <Form.Item name='gender'>
                        <Selector
                            options={[
                                { label: t('common.girl'), value: 'girl' },
                                { label: t('common.boy'), value: 'boy' },
                                { label: t('common.other'), value: 'other' },
                            ]}
                            multiple={false}
                            style={{ '--border-radius': '16px', '--padding': '10px 16px', '--gap': '8px', '--color': 'white', '--checked-color': '#fff1f2', '--checked-border': '2px solid #f43f5e', '--checked-text-color': '#f43f5e' }}
                        />
                    </Form.Item>

                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 mt-8 pl-2 tracking-wider">{t('onboarding.your_identity')}</div>
                    <Form.Item name='parentName' rules={[{ required: true }]}>
                        <Selector
                            columns={2}
                            options={ROLES.map(r => ({ label: r, value: r }))}
                            multiple={false}
                            style={{ '--border-radius': '16px', '--color': 'white', '--checked-color': '#fff1f2', '--checked-border': '2px solid #f43f5e', '--checked-text-color': '#f43f5e' }}
                        />
                    </Form.Item>
                </Form>
            ) : (
                <Form 
                    form={joinForm} 
                    onFinish={handleJoin}
                    footer={
                        <Button block type='submit' color='primary' size='large' loading={isLoading} shape="rounded"
                            className="!bg-rose-500 !border-none shadow-xl shadow-rose-200 !h-14 !text-lg !font-bold mt-6 hover:!bg-rose-600 transition-colors">
                            {t('onboarding.join_btn')} <ArrowRight size={20} className="ml-2 inline" strokeWidth={2.5} />
                        </Button>
                    }
                    initialValues={{ joinParentName: ['Dad'] }}
                >
                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 pl-2 tracking-wider">{t('settings.family_connection')}</div>
                    <Form.Item name='familyId' rules={[{ required: true }]}>
                        <Input placeholder={t('onboarding.family_id_placeholder')} className="!bg-white !rounded-2xl !px-4 !py-3 !font-mono !text-sm font-medium shadow-sm border border-slate-100" />
                    </Form.Item>

                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 mt-8 pl-2 tracking-wider">{t('onboarding.your_identity')}</div>
                    <Form.Item name='joinParentName' rules={[{ required: true }]}>
                        <Selector
                            columns={2}
                            options={ROLES.map(r => ({ label: r, value: r }))}
                            multiple={false}
                            style={{ '--border-radius': '16px', '--color': 'white', '--checked-color': '#fff1f2', '--checked-border': '2px solid #f43f5e', '--checked-text-color': '#f43f5e' }}
                        />
                    </Form.Item>
                </Form>
            )}
            </div>
        </div>
        
        <div className="mt-10 text-center">
           <p className="text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 opacity-80">
               <Heart size={12} fill="currentColor"/> Secure & Private Baby Journal
           </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
