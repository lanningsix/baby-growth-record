import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Language = 'en' | 'zh' | 'ja' | 'ko';

export const translations = {
  en: {
    app_name: "LittleSteps",
    loading: "Loading LittleSteps...",
    common: {
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      copy: "Copy",
      copied: "Copied",
      boy: "Boy",
      girl: "Girl",
      other: "Other",
      uploading: "Uploading...",
      success: "Success",
      error: "Error"
    },
    nav: {
      home: "Home",
      growth: "Growth",
      settings: "Settings"
    },
    onboarding: {
      title: "LittleSteps",
      subtitle: "Start your baby's digital journal",
      new_family: "New Family",
      join_existing: "Join Existing",
      baby_details: "Baby's Details",
      baby_name_placeholder: "Baby's Name",
      your_identity: "Your Identity",
      identity_placeholder: "e.g. Mom, Dad, Auntie Sue",
      create_btn: "Create Journal",
      family_id_label: "Family ID",
      family_id_placeholder: "UUID string",
      your_name_label: "Your Name",
      your_name_placeholder: "e.g. Dad",
      join_btn: "Join Family",
      error_create: "Failed to create family. Please try again.",
      error_join: "Invalid Family ID. Could not find a family.",
      connection_error: "Connection error."
    },
    timeline: {
      title: "Timeline",
      no_memories: "No memories found.",
      clear_filters: "Clear Filters",
      end_of_timeline: "End of timeline",
      added_by: "Added by",
      tap_to_view: "Tap to view",
      photo_memory: "Photo Memory",
      ai_insight_title: "AI Development Tracker",
      today: "Today",
      yesterday: "Yesterday"
    },
    growth: {
      title: "Growth Tracker",
      weight_progression: "Weight Progression (kg)",
      height_progression: "Height Progression (cm)",
      no_records: "No growth records yet. Add one to see the chart!"
    },
    settings: {
      baby_profile: "Baby Profile",
      name: "Name",
      dob: "Date of Birth",
      my_identity: "My Identity",
      display_name: "Display Name",
      display_name_desc: "This name will appear on memory cards you create.",
      family_connection: "Family Connection",
      family_id_label: "Your Family ID",
      share_hint: "Share this ID with family members to let them join.",
      logout: "Log Out / Switch Family",
      language: "Language"
    },
    add_modal: {
      title: "New Memory",
      tab_photo: "Photo/Video",
      tab_growth: "Measurements",
      tab_milestone: "Milestone",
      date_label: "Date",
      time_label: "Time",
      title_label: "Title",
      title_placeholder: "e.g., First steps at the park",
      height_label: "Height (cm)",
      weight_label: "Weight (kg)",
      photo_label: "Photo / Video",
      tap_upload: "Tap to upload photo",
      journal_label: "Journal Entry",
      ai_magic: "AI Magic Write",
      describe_placeholder: "Describe this moment...",
      posting_as: "Posting as:",
      save_btn: "Save Memory",
      growth_update: "Growth Update"
    },
    filters: {
      year: "Year",
      month: "Month",
      day: "Day",
      all: "All"
    }
  },
  zh: {
    app_name: "LittleSteps",
    loading: "正在加载 LittleSteps...",
    common: {
      save: "保存",
      saving: "保存中...",
      cancel: "取消",
      edit: "编辑",
      delete: "删除",
      copy: "复制",
      copied: "已复制",
      boy: "男孩",
      girl: "女孩",
      other: "其他",
      uploading: "上传中...",
      success: "成功",
      error: "错误"
    },
    nav: {
      home: "首页",
      growth: "成长",
      settings: "设置"
    },
    onboarding: {
      title: "LittleSteps",
      subtitle: "开启宝宝的成长日记",
      new_family: "创建家庭",
      join_existing: "加入家庭",
      baby_details: "宝宝信息",
      baby_name_placeholder: "宝宝昵称",
      your_identity: "您的身份",
      identity_placeholder: "例如：妈妈、爸爸",
      create_btn: "创建日记",
      family_id_label: "家庭 ID",
      family_id_placeholder: "请输入 UUID",
      your_name_label: "您的称呼",
      your_name_placeholder: "例如：爸爸",
      join_btn: "加入家庭",
      error_create: "创建失败，请重试。",
      error_join: "无效的家庭 ID，未找到家庭。",
      connection_error: "连接错误。"
    },
    timeline: {
      title: "时间轴",
      no_memories: "暂无回忆。",
      clear_filters: "清除筛选",
      end_of_timeline: "到底了",
      added_by: "记录人：",
      tap_to_view: "点击查看",
      photo_memory: "照片回忆",
      ai_insight_title: "AI 成长追踪",
      today: "今天",
      yesterday: "昨天"
    },
    growth: {
      title: "成长追踪",
      weight_progression: "体重曲线 (kg)",
      height_progression: "身高曲线 (cm)",
      no_records: "暂无成长记录，快去添加吧！"
    },
    settings: {
      baby_profile: "宝宝资料",
      name: "姓名",
      dob: "出生日期",
      my_identity: "我的身份",
      display_name: "显示名称",
      display_name_desc: "此名称将显示在您发布的记录上。",
      family_connection: "家庭连接",
      family_id_label: "您的家庭 ID",
      share_hint: "将此 ID 分享给家人以便他们加入。",
      logout: "退出登录 / 切换家庭",
      language: "语言"
    },
    add_modal: {
      title: "新回忆",
      tab_photo: "照片/视频",
      tab_growth: "身体测量",
      tab_milestone: "里程碑",
      date_label: "日期",
      time_label: "时间",
      title_label: "标题",
      title_placeholder: "例如：在公园迈出的第一步",
      height_label: "身高 (cm)",
      weight_label: "体重 (kg)",
      photo_label: "照片 / 视频",
      tap_upload: "点击上传照片",
      journal_label: "日记内容",
      ai_magic: "AI 智能润色",
      describe_placeholder: "描述一下这个时刻...",
      posting_as: "发布身份：",
      save_btn: "保存回忆",
      growth_update: "成长更新"
    },
    filters: {
      year: "年",
      month: "月",
      day: "日",
      all: "全部"
    }
  },
  ja: {
    app_name: "LittleSteps",
    loading: "読み込み中...",
    common: {
      save: "保存",
      saving: "保存中...",
      cancel: "キャンセル",
      edit: "編集",
      delete: "削除",
      copy: "コピー",
      copied: "コピーしました",
      boy: "男の子",
      girl: "女の子",
      other: "その他",
      uploading: "アップロード中...",
      success: "成功",
      error: "エラー"
    },
    nav: {
      home: "ホーム",
      growth: "成長記録",
      settings: "設定"
    },
    onboarding: {
      title: "LittleSteps",
      subtitle: "赤ちゃんのデジタル日記を始めましょう",
      new_family: "新規作成",
      join_existing: "参加する",
      baby_details: "赤ちゃんについて",
      baby_name_placeholder: "赤ちゃんの名前",
      your_identity: "あなたの立場",
      identity_placeholder: "例：ママ、パパ",
      create_btn: "日記を作成",
      family_id_label: "ファミリーID",
      family_id_placeholder: "IDを入力",
      your_name_label: "あなたの名前",
      your_name_placeholder: "例：パパ",
      join_btn: "ファミリーに参加",
      error_create: "作成に失敗しました。もう一度お試しください。",
      error_join: "無効なIDです。ファミリーが見つかりませんでした。",
      connection_error: "接続エラーが発生しました。"
    },
    timeline: {
      title: "タイムライン",
      no_memories: "思い出がまだありません。",
      clear_filters: "フィルターを解除",
      end_of_timeline: "これ以上ありません",
      added_by: "投稿者：",
      tap_to_view: "タップして表示",
      photo_memory: "写真の思い出",
      ai_insight_title: "AI 発達トラッカー",
      today: "今日",
      yesterday: "昨日"
    },
    growth: {
      title: "成長トラッカー",
      weight_progression: "体重の推移 (kg)",
      height_progression: "身長の推移 (cm)",
      no_records: "記録がありません。追加してみましょう！"
    },
    settings: {
      baby_profile: "赤ちゃんのプロフィール",
      name: "名前",
      dob: "生年月日",
      my_identity: "私の情報",
      display_name: "表示名",
      display_name_desc: "この名前は投稿カードに表示されます。",
      family_connection: "ファミリー接続",
      family_id_label: "ファミリーID",
      share_hint: "このIDを家族に共有して招待しましょう。",
      logout: "ログアウト / 切り替え",
      language: "言語"
    },
    add_modal: {
      title: "新しい思い出",
      tab_photo: "写真・動画",
      tab_growth: "身体測定",
      tab_milestone: "マイルストーン",
      date_label: "日付",
      time_label: "時間",
      title_label: "タイトル",
      title_placeholder: "例：公園で初めて歩いた",
      height_label: "身長 (cm)",
      weight_label: "体重 (kg)",
      photo_label: "写真 / 動画",
      tap_upload: "タップしてアップロード",
      journal_label: "日記",
      ai_magic: "AI マジック作成",
      describe_placeholder: "この瞬間のことを書いてみましょう...",
      posting_as: "投稿者：",
      save_btn: "保存する",
      growth_update: "成長記録"
    },
    filters: {
      year: "年",
      month: "月",
      day: "日",
      all: "すべて"
    }
  },
  ko: {
    app_name: "LittleSteps",
    loading: "로딩 중...",
    common: {
      save: "저장",
      saving: "저장 중...",
      cancel: "취소",
      edit: "편집",
      delete: "삭제",
      copy: "복사",
      copied: "복사됨",
      boy: "남자",
      girl: "여자",
      other: "기타",
      uploading: "업로드 중...",
      success: "성공",
      error: "오류"
    },
    nav: {
      home: "홈",
      growth: "성장",
      settings: "설정"
    },
    onboarding: {
      title: "LittleSteps",
      subtitle: "아기 성장 일기 시작하기",
      new_family: "새 가족 만들기",
      join_existing: "기존 가족 참여",
      baby_details: "아기 정보",
      baby_name_placeholder: "아기 이름",
      your_identity: "나의 역할",
      identity_placeholder: "예: 엄마, 아빠",
      create_btn: "일기장 만들기",
      family_id_label: "가족 ID",
      family_id_placeholder: "ID 입력",
      your_name_label: "나의 호칭",
      your_name_placeholder: "예: 아빠",
      join_btn: "가족 참여하기",
      error_create: "가족 생성에 실패했습니다. 다시 시도해주세요.",
      error_join: "유효하지 않은 ID입니다.",
      connection_error: "연결 오류가 발생했습니다."
    },
    timeline: {
      title: "타임라인",
      no_memories: "아직 기록이 없습니다.",
      clear_filters: "필터 초기화",
      end_of_timeline: "마지막 기록입니다",
      added_by: "작성자:",
      tap_to_view: "탭하여 보기",
      photo_memory: "사진 추억",
      ai_insight_title: "AI 발달 트래커",
      today: "오늘",
      yesterday: "어제"
    },
    growth: {
      title: "성장 트래커",
      weight_progression: "체중 변화 (kg)",
      height_progression: "키 변화 (cm)",
      no_records: "기록이 없습니다. 새로 추가해보세요!"
    },
    settings: {
      baby_profile: "아기 프로필",
      name: "이름",
      dob: "생년월일",
      my_identity: "내 프로필",
      display_name: "표시 이름",
      display_name_desc: "작성한 기록에 이 이름이 표시됩니다.",
      family_connection: "가족 연결",
      family_id_label: "가족 ID",
      share_hint: "이 ID를 가족에게 공유하세요.",
      logout: "로그아웃 / 가족 변경",
      language: "언어"
    },
    add_modal: {
      title: "새 추억",
      tab_photo: "사진/동영상",
      tab_growth: "신체 측정",
      tab_milestone: "마일스톤",
      date_label: "날짜",
      time_label: "시간",
      title_label: "제목",
      title_placeholder: "예: 공원에서 첫 걸음마",
      height_label: "키 (cm)",
      weight_label: "몸무게 (kg)",
      photo_label: "사진 / 동영상",
      tap_upload: "사진 업로드",
      journal_label: "일기 내용",
      ai_magic: "AI 자동 작성",
      describe_placeholder: "이 순간을 기록해보세요...",
      posting_as: "작성자:",
      save_btn: "저장하기",
      growth_update: "성장 기록"
    },
    filters: {
      year: "년",
      month: "월",
      day: "일",
      all: "전체"
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('app_language');
    if (stored && ['en', 'zh', 'ja', 'ko'].includes(stored)) {
      setLanguage(stored as Language);
    } else {
       // Auto-detect
       const browserLang = navigator.language;
       if (browserLang.startsWith('zh')) setLanguage('zh');
       else if (browserLang.startsWith('ja')) setLanguage('ja');
       else if (browserLang.startsWith('ko')) setLanguage('ko');
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  // Helper to access nested keys like 'nav.home'
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current as string;
  };

  const localeMap: Record<Language, string> = {
      en: 'en-US',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR'
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, locale: localeMap[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};