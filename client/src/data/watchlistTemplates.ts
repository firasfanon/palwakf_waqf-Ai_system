export type WatchlistTemplate = {
  id: string;
  name: string;
  description: string;
  query: string;
  categories?: string;
  sourceTypes?: string;
  statuses?: string;
};

export const WATCHLIST_TEMPLATES: WatchlistTemplate[] = [
  {
    id: 'palestinian-waqf',
    name: 'أوقاف فلسطينية',
    description: 'مراقبة الأوقاف الإسلامية في فلسطين',
    query: 'وقف OR أوقاف',
    categories: 'religion,charity',
    sourceTypes: 'news,article',
    statuses: 'pending,approved',
  },
  {
    id: 'charity-projects',
    name: 'مشاريع خيرية',
    description: 'مراقبة المشاريع الخيرية والإنسانية',
    query: 'مشروع خيري OR مشاريع إنسانية',
    categories: 'charity,humanitarian',
    sourceTypes: 'news,article',
    statuses: 'pending,approved',
  },
  {
    id: 'islamic-finance',
    name: 'التمويل الإسلامي',
    description: 'مراقبة أخبار التمويل والبنوك الإسلامية',
    query: 'تمويل إسلامي OR بنك إسلامي',
    categories: 'finance,banking',
    sourceTypes: 'news,article',
    statuses: 'pending,approved',
  },
  {
    id: 'education-waqf',
    name: 'أوقاف تعليمية',
    description: 'مراقبة الأوقاف والمشاريع التعليمية',
    query: 'وقف تعليمي OR مشروع تعليمي',
    categories: 'education,charity',
    sourceTypes: 'news,article',
    statuses: 'pending,approved',
  },
];
