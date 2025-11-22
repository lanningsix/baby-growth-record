
import React, { useState, useEffect } from 'react';
import { RecordType } from '../types';
import { generateJournalEntry } from '../services/api';
import { Loader2, Sparkles, X } from 'lucide-react';
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
  const [datePickerVisible, setDatePickerVisible] = useState(false);

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

  const mockUpload = async (file: File): Promise<ImageUploadItem> => {
    return {
      url: URL.createObjectURL(file),
      file: file, 
    } as ExtendedImageUploadItem;
  };

  return (
    <Popup
      visible={isOpen}
      onMaskClick={onClose}
      onClose={onClose}
      bodyStyle={{ borderTopLeftRadius: '40px', borderTopRightRadius: '40px', minHeight: '70vh', maxHeight: '90vh' }}
    >
      <div className="p-8 bg-white h-full flex flex-col">
        <div className="flex justify-between items-center mb-8 px-1">
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('add_modal.title')}</h2>
           <button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition">
               <X size={20} className="text-slate-500" />
           </button>
        </div>
        
        <div className="mb-8">
            <CapsuleTabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                className="font-bold"
                style={{ '--active-bg': '#f43f5e', '--tab-title-color': '#94a3b8' }}
            >
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
            className="text-base"
            footer={
              <Button 
                block type='submit' color='primary' size='large' loading={isSubmitting} 
                shape="rounded"
                className="!bg-rose-500 !border-none shadow-xl shadow-rose-200 mt-8 font-bold h-14 !text-lg hover:!bg-rose-600 transition"
              >
                {t('add_modal.save_btn')}
              </Button>
            }
          >
            <Form.Header>
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider pl-2">{t('add_modal.date_label')}</div>
            </Form.Header>
            <Form.Item 
                name='date' 
                trigger='onConfirm' 
                onClick={() => setDatePickerVisible(true)}
                arrow
                className="bg-slate-50 rounded-2xl mb-6 border border-slate-100"
            >
              <DatePicker
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                precision='minute'
                max={new Date()}
              >
                {value => value ? <span className="font-bold text-slate-700">{value.toLocaleString()}</span> : 'Select Date'}
              </DatePicker>
            </Form.Item>

            {activeTab === RecordType.GROWTH ? (
               <>
                 <Form.Header>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider pl-2">{t('nav.growth')}</div>
                 </Form.Header>
                 <div className="bg-slate-50 rounded-3xl p-3 mb-2 border border-slate-100">
                    <Form.Item name='height' label={<span className="font-bold text-slate-500">{t('add_modal.height_label')}</span>}>
                        <Input type='number' placeholder='0.0' className="font-bold text-slate-800" />
                    </Form.Item>
                    <Form.Item name='weight' label={<span className="font-bold text-slate-500">{t('add_modal.weight_label')}</span>}>
                        <Input type='number' placeholder='0.0' className="font-bold text-slate-800" />
                    </Form.Item>
                 </div>
               </>
            ) : (
               <>
                 <div className="bg-slate-50 rounded-3xl p-3 mb-6 border border-slate-100">
                    <Form.Item name='title' label={<span className="font-bold text-slate-500">{t('add_modal.title_label')}</span>} rules={[{ required: activeTab === RecordType.MILESTONE }]}>
                        <Input placeholder={t('add_modal.title_placeholder')} className="font-bold text-slate-800" />
                    </Form.Item>
                 </div>

                 <div className="bg-slate-50 rounded-[2rem] p-6 mb-6 border border-slate-100">
                    <div className="mb-4 text-sm font-bold text-slate-500 uppercase tracking-wide">{t('add_modal.photo_label')}</div>
                    <ImageUploader
                        value={fileList}
                        onChange={setFileList as any} 
                        upload={mockUpload}
                        maxCount={1}
                        preview={true}
                        style={{'--cell-size': '110px'}}
                        className="rounded-xl overflow-hidden"
                    />
                 </div>

                 <Form.Header>
                    <div className="flex justify-between items-center pl-2">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{t('add_modal.journal_label')}</span>
                        <button
                            type="button" 
                            onClick={handleMagicCompose} 
                            className="text-indigo-600 text-xs font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full active:bg-indigo-100 transition hover:bg-indigo-100"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                            AI Magic
                        </button>
                    </div>
                 </Form.Header>
                 <Form.Item name='description' className="bg-slate-50 rounded-3xl p-3 border border-slate-100">
                    <TextArea 
                        placeholder={t('add_modal.describe_placeholder')} 
                        autoSize={{ minRows: 4, maxRows: 8 }} 
                        className="text-slate-700 font-medium leading-relaxed"
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
