
import React from 'react';
import { BookOpen, Tag, ExternalLink, FileText, Quote } from 'lucide-react';

interface Reference {
  id: number | string;
  uuid?: string;
  title: string;
  category?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string | null;
  relevanceScore?: number;
  referenceDocumentId?: string | null;
  referenceDocumentTitle?: string | null;
  referenceFileId?: string | null;
  referenceFileName?: string | null;
  referenceFileUrl?: string | null;
  citationType?: string | null;
  citationLocator?: string | null;
  citationExcerpt?: string | null;
  citationsCount?: number;
  authorityLevel?: string | null;
  citationVerificationStatus?: 'missing' | 'linked' | 'verified' | 'rejected';
  visibilityScope?: 'public' | 'internal' | 'restricted';
  contentStatus?: string | null;
  trustEligible?: boolean;
  provider?: string;
  external?: boolean;
  sourceKind?: string;
  authority?: string;
  reviewed?: boolean;
}

interface ReferencesDisplayProps {
  references: Reference[];
}

export const ReferencesDisplay: React.FC<ReferencesDisplayProps> = ({ references }) => {
  if (!references || references.length === 0) {
    return null;
  }

  const authorityLabel: Record<string, string> = { official: 'مصدر رسمي', semi_official: 'مصدر شبه رسمي', reference: 'مرجع موثق', unverified: 'مصدر يحتاج تحقق' };
  const citationLabel: Record<string, string> = { verified: 'استشهاد متحقق', linked: 'استشهاد مرتبط', missing: 'استشهاد غير مكتمل', rejected: 'استشهاد مرفوض' };

  return (
    <div className="mt-3 pt-3 border-t border-emerald-100">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">
          المصادر والأدلة ({references.length})
        </span>
      </div>

      <div className="space-y-2">
        {references.map((ref, index) => {
          const detailsHref = ref.external && ref.sourceUrl ? ref.sourceUrl : `/knowledge-base/${ref.id}`;
          return (
            <div
              key={ref.uuid || ref.id || index}
              className="bg-emerald-50 rounded-lg p-3 hover:bg-emerald-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                      {ref.external ? `مصدر خارجي ${index + 1}` : `مرجع ${index + 1}`}
                    </span>
                    {ref.category && (
                      <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-xs">
                        {ref.category}
                      </span>
                    )}
                    {typeof ref.citationsCount === 'number' && ref.citationsCount > 0 && (
                      <span className="text-xs text-emerald-800 font-medium">
                        اقتباسات: {ref.citationsCount}
                      </span>
                    )}
                    {ref.external && ref.provider && (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-800">{ref.provider}</span>
                    )}
                    {ref.external && ref.authority && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-800">{ref.authority}</span>
                    )}
                    {ref.authorityLevel && (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                        {authorityLabel[ref.authorityLevel] || ref.authorityLevel}
                      </span>
                    )}
                    {ref.citationVerificationStatus && (
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${ref.citationVerificationStatus === 'verified' ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {citationLabel[ref.citationVerificationStatus] || ref.citationVerificationStatus}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-medium text-gray-800 mb-1">
                    {ref.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    {ref.source && (
                      <span className="flex items-center gap-1">
                        <ExternalLink size={12} />
                        {ref.source}
                      </span>
                    )}

                    {ref.referenceDocumentTitle && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {ref.referenceDocumentTitle}
                      </span>
                    )}

                    {ref.referenceFileName && (
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {ref.referenceFileName}
                      </span>
                    )}

                    {typeof ref.relevanceScore === 'number' && ref.relevanceScore > 0 && (
                      <span className="text-emerald-700 font-medium">
                        الصلة: {Math.round(ref.relevanceScore * 10) / 10}
                      </span>
                    )}
                  </div>

                  {ref.citationLocator && (
                    <div className="mt-2 text-xs text-emerald-900">
                      <span className="font-semibold">الموضع:</span> {ref.citationLocator}
                    </div>
                  )}

                  {ref.citationExcerpt && (
                    <div className="mt-2 rounded-md border border-emerald-200 bg-white/70 p-2 text-xs text-gray-700">
                      <div className="mb-1 flex items-center gap-1 font-semibold text-emerald-700">
                        <Quote size={12} />
                        مقتطف مرجعي
                      </div>
                      <div className="line-clamp-4 whitespace-pre-wrap">{ref.citationExcerpt}</div>
                    </div>
                  )}

                  {ref.tags && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {ref.tags.split(',').slice(0, 3).join(' • ')}
                      </span>
                    </div>
                  )}
                </div>

                <a
                  href={detailsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-800 transition-colors"
                  title="عرض التفاصيل"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
