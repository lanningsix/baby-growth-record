import React, { useState } from 'react';
import { createFamily, getProfile } from '../services/api';
import { Baby, Heart } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Form, Input, Button, DatePicker, Selector, AutoCenter, Toast, Card } from 'antd-mobile';

interface Props {
  onComplete: () => void;
}

const ROLES = ['Mom', 'Dad', 'Grandma', 'Grandpa'];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);
  
  // Create Form State
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
      Toast.show({
          icon: 'fail',
          content: t('onboarding.error_create'),
      })
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
        Toast.show({
            icon: 'fail',
            content: t('onboarding.error_join'),
        })
      }
    } catch (err) {
      localStorage.removeItem('familyId');
      Toast.show({
        icon: 'fail',
        content: t('onboarding.connection_error'),
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-rose-50">
      <div className="w-full max-w-md relative">
        {/* Decorative Background Elements */}
        <div className="absolute -top-20 -right-10 w-40 h-40 bg-pink-200 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-blue-200 rounded-full opacity-50 blur-3xl"></div>

        <div className="relative z-10 mb-8">
          <AutoCenter>
            <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-rose-200 mb-4">
                <Baby size={40} />
            </div>
          </AutoCenter>
          <AutoCenter>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('onboarding.title')}</h1>
          </AutoCenter>
          <AutoCenter>
            <p className="text-gray-500 text-sm">{t('onboarding.subtitle')}</p>
          </AutoCenter>
        </div>

        <Card className="shadow-lg rounded-3xl">
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'create' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'
              }`}
            >
              {t('onboarding.new_family')}
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'join' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400'
              }`}
            >
              {t('onboarding.join_existing')}
            </button>
          </div>

          {activeTab === 'create' ? (
            <Form 
                form={form} 
                onFinish={handleCreate} 
                layout='horizontal'
                footer={
                    <Button block type='submit' color='primary' size='large' loading={isLoading} shape="rounded">
                        {t('onboarding.create_btn')}
                    </Button>
                }
                initialValues={{ gender: ['girl'], parentName: ['Mom'] }}
            >
                <Form.Header>{t('onboarding.baby_details')}</Form.Header>
                <Form.Item name='babyName' label={t('common.name')} rules={[{ required: true }]}>
                    <Input placeholder={t('onboarding.baby_name_placeholder')} />
                </Form.Item>
                
                <Form.Item 
                    name='birthDate' 
                    label={t('settings.dob')} 
                    trigger='onConfirm' 
                    onClick={() => setDatePickerVisible(true)}
                    rules={[{ required: true }]}
                >
                    <DatePicker
                        visible={datePickerVisible}
                        onClose={() => setDatePickerVisible(false)}
                        max={new Date()}
                    >
                        {value => value ? value.toLocaleDateString() : <span className="text-gray-300">{t('settings.dob')}</span>}
                    </DatePicker>
                </Form.Item>

                <Form.Item name='gender' label={t('onboarding.baby_details')}>
                    <Selector
                        options={[
                            { label: t('common.girl'), value: 'girl' },
                            { label: t('common.boy'), value: 'boy' },
                            { label: t('common.other'), value: 'other' },
                        ]}
                        multiple={false}
                    />
                </Form.Item>

                <Form.Header>{t('onboarding.your_identity')}</Form.Header>
                <Form.Item name='parentName' rules={[{ required: true }]}>
                    <Selector
                        columns={2}
                        options={ROLES.map(r => ({ label: r, value: r }))}
                        multiple={false}
                    />
                </Form.Item>
            </Form>
          ) : (
            <Form 
                form={joinForm} 
                onFinish={handleJoin}
                footer={
                    <Button block type='submit' color='primary' size='large' loading={isLoading} shape="rounded">
                        {t('onboarding.join_btn')}
                    </Button>
                }
                initialValues={{ joinParentName: ['Dad'] }}
            >
                <Form.Header>{t('settings.family_connection')}</Form.Header>
                <Form.Item name='familyId' label={t('onboarding.family_id_label')} rules={[{ required: true }]}>
                    <Input placeholder={t('onboarding.family_id_placeholder')} />
                </Form.Item>

                <Form.Header>{t('onboarding.your_identity')}</Form.Header>
                 <Form.Item name='joinParentName' rules={[{ required: true }]}>
                    <Selector
                        columns={2}
                        options={ROLES.map(r => ({ label: r, value: r }))}
                        multiple={false}
                    />
                </Form.Item>
            </Form>
          )}
        </Card>
        
        <AutoCenter className="mt-8 text-gray-400 text-xs">
           <Heart size={12} className="inline mr-1"/> Made for your little ones
        </AutoCenter>
      </div>
    </div>
  );
};

export default Onboarding;