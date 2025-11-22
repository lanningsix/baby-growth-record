import React, { useState, useEffect } from 'react';
import { RecordType } from '../types';
import { generateJournalEntry } from '../services/api';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';
import { 
  Popup, 
  Form, 
  Input, 
  Button, 
  TextArea, 
  DatePicker, 
  ImageUploader, 
  CapsuleTabs,
  Toast
} from 'antd-mobile';
import type { ImageUploadItem } from 'antd-mobile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  authorName: string;
}

type ExtendedImageUploadItem = ImageUploadItem & { file?: File };

const AddRecordModal: React.FC<Props> = ({ isOpen, onClose, onSave, authorName }) => {
  const { t, language } = useTranslation();
  const [form] = Form.useForm();
  
  const [activeTab, setActiveTab] = useState<string>(RecordType.PHOTO);
  const [fileList, setFileList] = useState<ExtendedImageUploadItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date picker controls
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(RecordType.PHOTO);
      setFileList([]);
      form.setFieldsValue({
        date: new Date(),
        title: '',
        description: '',
        height: '',
        weight: '',
        author: authorName
      });
    }
  }, [isOpen, form, authorName]);

  const handleMagicCompose = async () => {
    const currentDesc = form.getFieldValue('description');
    const imageItem = fileList[0];
    
    setIsGenerating(true);
    Toast.show({
        icon: 'loading',
        content: t('add_modal.ai_magic'),
        duration: 0
    });
    
    const text = await generateJournalEntry(imageItem?.url, currentDesc, language);
    
    Toast.clear();
    form.setFieldsValue({ description: text });
    setIsGenerating(false);
  };

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        type: activeTab,
        date: values.date.toISOString(),
        title: values.title,
        description: values.description,
        author: authorName,
        file: fileList[0]?.file
      };

      if (activeTab === RecordType.GROWTH) {
         payload.title = t('add_modal.growth_update');
         payload.growthData = {
            height: values.height ? parseFloat(values.height) : undefined,
            weight: values.weight ? parseFloat(values.weight) : undefined,
         };
      } else if (!values.title && activeTab !== RecordType.PHOTO) {
          // For photo type, title is optional or can be defaulted
          payload.title = t('timeline.photo_memory');
      }

      await onSave(payload);
      onClose();
      Toast.show({ icon: 'success', content: t('common.save') });
    } catch (e) {
      Toast.show({ icon: 'fail', content: 'Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock upload to just store file object locally for the final submit
  const mockUpload = async (file: File): Promise<ImageUploadItem> => {
    return {
      url: URL.createObjectURL(file),
      file: file, // Store original file in the extra property
    } as ExtendedImageUploadItem;
  };

  return (
    <Popup
      visible={isOpen}
      onMaskClick={onClose}
      onClose={onClose}
      bodyStyle={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px', minHeight: '60vh', maxHeight: '90vh' }}
    >
      <div className="p-4 bg-white h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 px-2">
           <h2 className="text-xl font-bold text-gray-800">{t('add_modal.title')}</h2>
           <Button fill='none' onClick={onClose} color='danger'>{t('common.cancel')}</Button>
        </div>
        
        <div className="mb-4">
            <CapsuleTabs activeKey={activeTab} onChange={setActiveTab}>
                <CapsuleTabs.Tab title={t('add_modal.tab_photo')} key={RecordType.PHOTO} />
                <CapsuleTabs.Tab title={t('add_modal.tab_growth')} key={RecordType.GROWTH} />
                <CapsuleTabs.Tab title={t('add_modal.tab_milestone')} key={RecordType.MILESTONE} />
            </CapsuleTabs>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Form 
            form={form} 
            layout='horizontal' 
            onFinish={onFinish}
            footer={
              <Button block type='submit' color='primary' size='large' loading={isSubmitting} shape="rounded">
                {t('add_modal.save_btn')}
              </Button>
            }
          >
            <Form.Header>{t('add_modal.date_label')}</Form.Header>
            <Form.Item 
                name='date' 
                trigger='onConfirm' 
                onClick={() => setDatePickerVisible(true)}
                arrow
            >
              <DatePicker
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                precision='minute'
                max={new Date()}
              >
                {value => value ? value.toLocaleString() : 'Select Date'}
              </DatePicker>
            </Form.Item>

            {activeTab === RecordType.GROWTH ? (
               <>
                 <Form.Header>{t('nav.growth')}</Form.Header>
                 <Form.Item name='height' label={t('add_modal.height_label')}>
                    <Input type='number' placeholder='0.0' />
                 </Form.Item>
                 <Form.Item name='weight' label={t('add_modal.weight_label')}>
                    <Input type='number' placeholder='0.0' />
                 </Form.Item>
               </>
            ) : (
               <>
                 <Form.Item name='title' label={t('add_modal.title_label')} rules={[{ required: activeTab === RecordType.MILESTONE }]}>
                    <Input placeholder={t('add_modal.title_placeholder')} />
                 </Form.Item>

                 <Form.Item label={t('add_modal.photo_label')}>
                    <ImageUploader
                        value={fileList}
                        onChange={setFileList as any} 
                        upload={mockUpload}
                        maxCount={1}
                        preview={true}
                    />
                 </Form.Item>

                 <Form.Header>
                    <div className="flex justify-between items-center">
                        <span>{t('add_modal.journal_label')}</span>
                        <span 
                            onClick={handleMagicCompose} 
                            className="text-purple-600 text-xs flex items-center gap-1 bg-purple-50 px-2 py-1 rounded cursor-pointer"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} AI
                        </span>
                    </div>
                 </Form.Header>
                 <Form.Item name='description'>
                    <TextArea 
                        placeholder={t('add_modal.describe_placeholder')} 
                        autoSize={{ minRows: 3, maxRows: 6 }} 
                    />
                 </Form.Item>
               </>
            )}
          </Form>
        </div>
      </div>
    </Popup>
  );
};

export default AddRecordModal;