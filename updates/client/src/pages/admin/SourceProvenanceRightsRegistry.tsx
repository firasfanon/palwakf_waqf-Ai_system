import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Pencil,
  AlertTriangle,
  History,
  Database,
  Search,
  RefreshCw,
  Bot,
  LockKeyhole,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react';
import AdminPage from '@/components/admin/ui/AdminPage';
import AdminCard from '@/components/admin/ui/AdminCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';

const RIGHTS_LABELS: Record<string, string> = {
  unknown: 'غير محدد',
  review_required: 'يتطلب مراجعة',
  licensed: 'مرخّص',
  permission_recorded: 'إذن موثق',
  public_domain: 'ملكية عامة',
  official_publication: 'نشر رسمي',
  restricted: 'مقيد',
  prohibited: 'محظور',
  removed: 'تمت الإزالة',
};

const RAG_LABELS: Record<string, string> = {
  review_only: 'مراجعة فقط',
  internal_only: 'داخلي فقط',
  eligible_after_review: 'مؤهل بعد مراجعة',
  blocked: 'محظور',
};

const DISPLAY_LABELS: Record<string, string> = {
  metadata_only: 'بيانات وصفية فقط',
  excerpt_only: 'مقتطف فقط',
  full_text_permitted: 'عرض كامل مسموح',
  blocked: 'محظور',
};

const initialForm = {
  sourceId: null as string | null,
  name: '',
  baseUrl: '',
  description: '',
  authorityLevel: 'unverified' as 'official' | 'semi_official' | 'reference' | 'unverified',
  isActive: true,
  changeReason: '',
  rightsStatus: 'review_required' as keyof typeof RIGHTS_LABELS,
  licenseType: '',
  licenseUrl: '',
  publisherName: '',
  rightsHolderName: '',
  attributionText: '',
  permissionReference: '',
  termsUrl: '',
  allowedUseScope: '',
  fullTextRetentionAllowed: null as boolean | null,
  ragEligibility: 'review_only' as keyof typeof RAG_LABELS,
  publicDisplayEligibility: 'metadata_only' as keyof typeof DISPLAY_LABELS,
  notes: '',
};

type RegistrySource = any;
type PilotSelection = {
  selected: boolean;
  evidenceTier: 'T3_CONTROLLED_INTERNAL_EVIDENCE' | 'T4_VERIFIED_CITATION_EVIDENCE';
  internalUseApprovalRef: string;
};

function dateLabel(value?: string | null) {
  if (!value) return 'غير مسجل';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-PS', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function riskVariant(status?: string | null) {
  if (['licensed', 'permission_recorded', 'public_domain', 'official_publication'].includes(String(status))) return 'secondary' as const;
  if (['restricted', 'prohibited', 'removed'].includes(String(status))) return 'destructive' as const;
  return 'outline' as const;
}

function sourceToForm(source: RegistrySource): typeof initialForm {
  const rights = source.rights || {};
  return {
    sourceId: source.id,
    name: source.name || '',
    baseUrl: source.baseUrl || '',
    description: source.description || '',
    authorityLevel: (['official', 'semi_official', 'reference', 'unverified'].includes(source.authorityLevel) ? source.authorityLevel : 'unverified') as typeof initialForm.authorityLevel,
    isActive: source.isActive !== false,
    changeReason: '',
    rightsStatus: (Object.prototype.hasOwnProperty.call(RIGHTS_LABELS, rights.rights_status) ? rights.rights_status : 'review_required') as typeof initialForm.rightsStatus,
    licenseType: rights.license_type || '',
    licenseUrl: rights.license_url || '',
    publisherName: rights.publisher_name || '',
    rightsHolderName: rights.rights_holder_name || '',
    attributionText: rights.attribution_text || '',
    permissionReference: rights.permission_reference || '',
    termsUrl: rights.terms_url || '',
    allowedUseScope: rights.allowed_use_scope || '',
    fullTextRetentionAllowed: typeof rights.full_text_retention_allowed === 'boolean' ? rights.full_text_retention_allowed : null,
    ragEligibility: (Object.prototype.hasOwnProperty.call(RAG_LABELS, rights.rag_eligibility) ? rights.rag_eligibility : 'review_only') as typeof initialForm.ragEligibility,
    publicDisplayEligibility: (Object.prototype.hasOwnProperty.call(DISPLAY_LABELS, rights.public_display_eligibility) ? rights.public_display_eligibility : 'metadata_only') as typeof initialForm.publicDisplayEligibility,
    notes: rights.notes || '',
  };
}

export default function SourceProvenanceRightsRegistry() {
  const registry = trpc.sourceProvenance.registry.useQuery(undefined, { retry: false });
  const access = trpc.sourceProvenance.access.useQuery(undefined, { retry: false });
  const legacyReconciliation = trpc.sourceProvenance.legacyManusReconciliation.useQuery(undefined, { retry: false });
  const autonomousAudit = trpc.sourceProvenance.autonomousAudit.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const externalVerification = trpc.sourceProvenance.externalVerification.useQuery({ maxUrls: 32 }, { enabled: false, retry: false, refetchOnWindowFocus: false });
  const controlledRegistryDesign = trpc.sourceProvenance.controlledRegistryDesign.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const controlledReleasePlan = trpc.sourceProvenance.controlledReleasePlan.useQuery(undefined, { retry: false, staleTime: 30_000, refetchOnWindowFocus: false });
  const pilotStatus = trpc.agenticRagPilot.status.useQuery(undefined, { retry: false, staleTime: 15_000, refetchOnWindowFocus: false });
  const pilotCandidates = trpc.agenticRagPilot.candidates.useQuery(undefined, { retry: false, staleTime: 15_000, refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<RegistrySource | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [form, setForm] = useState(initialForm);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [legacySearch, setLegacySearch] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditDisposition, setAuditDisposition] = useState('all');
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalSearch, setExternalSearch] = useState('');
  const [externalDisposition, setExternalDisposition] = useState('all');
  const [c4Open, setC4Open] = useState(false);
  const [c4Search, setC4Search] = useState('');
  const [c4Disposition, setC4Disposition] = useState('all');
  const [releasePlanOpen, setReleasePlanOpen] = useState(false);
  const [releasePlanSearch, setReleasePlanSearch] = useState('');
  const [releasePlanDisposition, setReleasePlanDisposition] = useState('CONTROLLED_METADATA_PILOT_CANDIDATE');
  const [pilotSelection, setPilotSelection] = useState<Record<string, PilotSelection>>({});
  const [pilotRightsApprovalRef, setPilotRightsApprovalRef] = useState('');
  const [pilotReviewerNote, setPilotReviewerNote] = useState('');
  const [pilotInternalOnlyAcknowledged, setPilotInternalOnlyAcknowledged] = useState(false);
  const [pilotModelBoundaryAcknowledged, setPilotModelBoundaryAcknowledged] = useState(false);
  const [pilotSession, setPilotSession] = useState<any>(null);
  const [pilotQuestion, setPilotQuestion] = useState('');
  const [pilotResult, setPilotResult] = useState<any>(null);
  const [rightsActivationDetailsOpen, setRightsActivationDetailsOpen] = useState(false);
  const [pilotGovernanceOpen, setPilotGovernanceOpen] = useState(false);
  const [pilotTechnicalOpen, setPilotTechnicalOpen] = useState(false);

  const canManage = registry.data?.capability?.schemaReady === true && access.data?.canManage === true;
  const sources = registry.data?.sources || [];
  const sourceSummary = registry.data?.summary;
  const schemaReason = registry.data?.capability?.reason;
  const legacySummary = legacyReconciliation.data?.summary;
  const legacyItems = useMemo(() => {
    const needle = legacySearch.trim().toLowerCase();
    const items = legacyReconciliation.data?.items || [];
    if (!needle) return items;
    return items.filter((item: any) => [item.title, item.raw?.source, item.raw?.sourceUrl, item.raw?.url, item.raw?.pdfUrl, item.raw?.author, item.raw?.publisher, item.legacySourceFile, item.legacyTableName]
      .filter(Boolean).some((value: string) => String(value).toLowerCase().includes(needle)));
  }, [legacyReconciliation.data?.items, legacySearch]);

  const auditSummary = autonomousAudit.data?.summary;
  const externalSummary = externalVerification.data?.summary;
  const c4Summary = controlledRegistryDesign.data?.summary;
  const releasePlanSummary = controlledReleasePlan.data?.summary;
  const externalEntries = useMemo(() => {
    const needle = externalSearch.trim().toLowerCase();
    const entries = externalVerification.data?.entries || [];
    return entries.filter((entry: any) => {
      const matchesDisposition = externalDisposition === 'all' || entry.matrixDisposition === externalDisposition;
      if (!matchesDisposition) return false;
      if (!needle) return true;
      return [entry.title, entry.c2DispositionLabel, entry.matrixLabel, entry.requestedUrl, ...(entry.authors || []), ...(entry.publishers || [])]
        .filter(Boolean)
        .some((value: string) => String(value).toLowerCase().includes(needle));
    });
  }, [externalVerification.data?.entries, externalDisposition, externalSearch]);
  const auditClusters = useMemo(() => {
    const needle = auditSearch.trim().toLowerCase();
    const clusters = autonomousAudit.data?.clusters || [];
    return clusters.filter((cluster: any) => {
      const matchesDisposition = auditDisposition === 'all' || cluster.disposition === auditDisposition;
      if (!matchesDisposition) return false;
      if (!needle) return true;
      return [cluster.title, ...(cluster.authors || []), ...(cluster.publishers || []), ...(cluster.urls || []), ...(cluster.rawSourceValues || []), cluster.dispositionLabel]
        .filter(Boolean)
        .some((value: string) => String(value).toLowerCase().includes(needle));
    });
  }, [autonomousAudit.data?.clusters, auditDisposition, auditSearch]);
  const c4Blueprints = useMemo(() => {
    const needle = c4Search.trim().toLowerCase();
    const blueprints = controlledRegistryDesign.data?.registryBlueprints || [];
    return blueprints.filter((blueprint: any) => {
      const matchesDisposition = c4Disposition === 'all' || blueprint.designDisposition === c4Disposition;
      if (!matchesDisposition) return false;
      if (!needle) return true;
      return [blueprint.proposedSourceName, blueprint.canonicalUrl, blueprint.domain, blueprint.designLabel, ...(blueprint.authorEvidence || []), ...(blueprint.publisherEvidence || [])]
        .filter(Boolean)
        .some((value: string) => String(value).toLowerCase().includes(needle));
    });
  }, [controlledRegistryDesign.data?.registryBlueprints, c4Disposition, c4Search]);
  const releasePlanEntries = useMemo(() => {
    const needle = releasePlanSearch.trim().toLowerCase();
    const entries = controlledReleasePlan.data?.entries || [];
    return entries.filter((entry: any) => {
      const matchesDisposition = releasePlanDisposition === 'all' || entry.disposition === releasePlanDisposition;
      if (!matchesDisposition) return false;
      if (!needle) return true;
      return [entry.title, entry.c2DispositionLabel, entry.c3MatrixLabel, entry.dispositionLabel, entry.requestedUrl, ...(entry.authors || []), ...(entry.publishers || [])]
        .filter(Boolean)
        .some((value: string) => String(value).toLowerCase().includes(needle));
    });
  }, [controlledReleasePlan.data?.entries, releasePlanDisposition, releasePlanSearch]);
  const pilotCandidateRows = pilotCandidates.data?.candidates || [];
  const selectedPilotBindings = pilotCandidateRows
    .filter((candidate: any) => pilotSelection[`${candidate.clusterKey}:${candidate.documentId}`]?.selected)
    .map((candidate: any) => ({
      clusterKey: candidate.clusterKey,
      documentId: candidate.documentId,
      evidenceTier: pilotSelection[`${candidate.clusterKey}:${candidate.documentId}`]?.evidenceTier || 'T3_CONTROLLED_INTERNAL_EVIDENCE',
      internalUseApprovalRef: pilotSelection[`${candidate.clusterKey}:${candidate.documentId}`]?.internalUseApprovalRef || '',
    }));

  const pilotStatusCode = pilotStatus.data?.status || '';
  const pilotCandidateCount = pilotStatus.data?.availableCandidateDocuments ?? pilotCandidateRows.length;
  const c3C4EvidenceReady = Boolean(pilotStatusCode) && pilotStatusCode !== 'C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD';
  const pilotMaterialReady = pilotStatusCode === 'READY_FOR_OPERATOR_BINDING' && pilotCandidateRows.length > 0;
  const pilotSessionApprovalReady = pilotMaterialReady
    && selectedPilotBindings.length > 0
    && Boolean(pilotRightsApprovalRef.trim())
    && selectedPilotBindings.every((binding: any) => Boolean(binding.internalUseApprovalRef.trim()))
    && pilotInternalOnlyAcknowledged
    && pilotModelBoundaryAcknowledged;
  const pilotWorkflowSteps = [
    {
      number: '1',
      title: 'تشغيل C3',
      detail: c3C4EvidenceReady ? 'دليل C3 الحالي متاح ضمن دورة القراءة.' : 'مطلوب قبل أي قراءة C4 جديدة.',
      state: c3C4EvidenceReady ? 'complete' : 'current',
    },
    {
      number: '2',
      title: 'قراءة C4',
      detail: c3C4EvidenceReady ? 'تمت القراءة في دورة الأدلة الحالية.' : 'تُنفذ بعد C3 وفي العملية الخارجية نفسها.',
      state: c3C4EvidenceReady ? 'complete' : 'blocked',
    },
    {
      number: '3',
      title: 'أهلية المادة',
      detail: pilotMaterialReady ? `${pilotCandidateCount} مادة قابلة للربط الحتمي.` : c3C4EvidenceReady ? 'لا توجد مادة حتمية قابلة للربط الآن.' : 'ينتظر نتيجة C4 الحالية.',
      state: pilotMaterialReady ? 'complete' : c3C4EvidenceReady ? 'current' : 'blocked',
    },
    {
      number: '4',
      title: 'اعتماد الاستخدام الداخلي',
      detail: pilotSessionApprovalReady ? 'اكتملت مراجع الحقوق والإقرارات.' : pilotMaterialReady ? 'اختر المادة وأدخل مراجع الجلسة.' : 'مقفل حتى أهلية المادة.',
      state: pilotSessionApprovalReady ? 'complete' : pilotMaterialReady ? 'current' : 'blocked',
    },
    {
      number: '5',
      title: 'جلسة AR1',
      detail: pilotSession ? 'جلسة مؤقتة نشطة داخل الخادم.' : pilotSessionApprovalReady ? 'جاهزة للإنشاء بعد مراجعة المدخلات.' : 'لا يمكن إنشاؤها قبل المراحل السابقة.',
      state: pilotSession ? 'current' : pilotSessionApprovalReady ? 'ready' : 'blocked',
    },
  ] as const;

  const openRequiredEvidenceStep = () => {
    if (!c3C4EvidenceReady) {
      setExternalOpen(true);
      window.setTimeout(() => document.getElementById('c3-external-verification')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      return;
    }
    setReleasePlanOpen(true);
    void controlledReleasePlan.refetch();
    window.setTimeout(() => document.getElementById('c4-controlled-release-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const upsert = trpc.sourceProvenance.upsert.useMutation({
    onSuccess: async () => {
      toast.success(form.sourceId ? 'تم حفظ تعديل المصدر وسجل الرابط.' : 'تمت إضافة المصدر إلى السجل المحكوم.');
      setDialogOpen(false);
      setForm(initialForm);
      await utils.sourceProvenance.registry.invalidate();
    },
    onError: (error) => toast.error('تعذر حفظ المصدر', { description: error.message }),
  });

  const archive = trpc.sourceProvenance.archive.useMutation({
    onSuccess: async () => {
      toast.success('تمت أرشفة المصدر وإيقافه دون حذف تاريخ الإسناد.');
      setArchiveTarget(null);
      setArchiveReason('');
      await utils.sourceProvenance.registry.invalidate();
    },
    onError: (error) => toast.error('تعذرت أرشفة المصدر', { description: error.message }),
  });

  const startPilotSession = trpc.agenticRagPilot.startSession.useMutation({
    onSuccess: (data) => {
      setPilotSession(data);
      setPilotResult(null);
      toast.success('تم إنشاء جلسة AR1 الداخلية المؤقتة.', { description: 'لا توجد أي كتابة دائمة للمصادر أو الحقوق أو corpus.' });
      void pilotStatus.refetch();
    },
    onError: (error) => toast.error('تعذر إنشاء جلسة AR1', { description: error.message }),
  });

  const askPilot = trpc.agenticRagPilot.ask.useMutation({
    onSuccess: (data) => {
      setPilotResult(data);
      toast.success(data.action === 'answer' ? 'اكتملت الاستجابة المقيدة بالاستشهادات.' : 'تم تطبيق بوابة الامتناع أو التصعيد.');
    },
    onError: (error) => toast.error('تعذر تنفيذ السؤال التجريبي', { description: error.message }),
  });

  const rollbackPilot = trpc.agenticRagPilot.rollbackSession.useMutation({
    onSuccess: () => {
      setPilotSession(null);
      setPilotResult(null);
      setPilotQuestion('');
      toast.success('تمت إزالة جلسة AR1 من ذاكرة الخادم.');
      void pilotStatus.refetch();
    },
    onError: (error) => toast.error('تعذر إلغاء جلسة AR1', { description: error.message }),
  });

  const pilotEvents = trpc.agenticRagPilot.events.useQuery(
    { sessionId: pilotSession?.id || '' },
    { enabled: Boolean(pilotSession?.id), retry: false, refetchOnWindowFocus: false }
  );

  const updatePilotSelection = (candidate: any, patch: Partial<PilotSelection>) => {
    const key = `${candidate.clusterKey}:${candidate.documentId}`;
    setPilotSelection((previous) => ({
      ...previous,
      [key]: {
        selected: previous[key]?.selected || false,
        evidenceTier: previous[key]?.evidenceTier || 'T3_CONTROLLED_INTERNAL_EVIDENCE',
        internalUseApprovalRef: previous[key]?.internalUseApprovalRef || '',
        ...patch,
      },
    }));
  };

  const title = useMemo(() => form.sourceId ? 'تعديل مصدر وحقوقه' : 'إضافة مصدر وحقوقه', [form.sourceId]);

  const openCreate = () => {
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEdit = (source: RegistrySource) => {
    setForm(sourceToForm(source));
    setDialogOpen(true);
  };

  const toggle = (id: string) => setExpanded((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const save = () => {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast.error('اسم المصدر والرابط الحالي مطلوبان.');
      return;
    }
    if (form.sourceId && !form.changeReason.trim()) {
      toast.error('سبب تعديل الرابط أو ملف الحقوق مطلوب لحفظ أثر التغيير.');
      return;
    }
    upsert.mutate({
      sourceId: form.sourceId,
      name: form.name.trim(),
      baseUrl: form.baseUrl.trim(),
      description: form.description.trim() || null,
      authorityLevel: form.authorityLevel,
      isActive: form.isActive,
      changeReason: form.changeReason.trim() || null,
      rights: {
        rightsStatus: form.rightsStatus,
        licenseType: form.licenseType.trim() || null,
        licenseUrl: form.licenseUrl.trim() || null,
        publisherName: form.publisherName.trim() || null,
        rightsHolderName: form.rightsHolderName.trim() || null,
        attributionText: form.attributionText.trim() || null,
        permissionReference: form.permissionReference.trim() || null,
        termsUrl: form.termsUrl.trim() || null,
        allowedUseScope: form.allowedUseScope.trim() || null,
        fullTextRetentionAllowed: form.fullTextRetentionAllowed,
        ragEligibility: form.ragEligibility,
        publicDisplayEligibility: form.publicDisplayEligibility,
        notes: form.notes.trim() || null,
      },
    });
  };

  const confirmArchive = () => {
    if (!archiveTarget || !archiveReason.trim()) {
      toast.error('سبب الأرشفة مطلوب لحفظ سجل الحوكمة.');
      return;
    }
    archive.mutate({ sourceId: archiveTarget.id, reason: archiveReason.trim() });
  };

  if (registry.isLoading) {
    return <AdminPage><p className="text-sm text-muted-foreground">جارٍ تحميل سجل المصادر والحقوق…</p></AdminPage>;
  }

  return (
    <AdminPage className="source-provenance-rights-registry">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Scale className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold">سجل المصادر وحقوق النشر</h1>
            </div>
            <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
              سجل منشأ وإسناد وحقوق للمصادر والمواد المرتبطة بها. يثبت الرابط والسجل التاريخي ولا يمنح ترخيصًا قانونيًا تلقائيًا؛
              حالات الحقوق تحتاج دليلًا أو مراجعة بشرية مستقلة.
            </p>
          </div>
          <Button onClick={openCreate} disabled={!canManage} className="w-full lg:w-auto">
            <Plus className="ml-2 h-4 w-4" /> إضافة مصدر جديد
          </Button>
        </div>

        {!registry.data?.capability?.schemaReady ? (
          <AdminCard
            title="حالة طبقة الحقوق"
            description="هذه البيئة في وضع قراءة فقط؛ لا يوجد إجراء مطلوب من المشغّل داخل هذه الصفحة الآن."
            headerRight={<Badge variant="outline">قراءة فقط</Badge>}
          >
            <div className="space-y-3">
              <div className="flex gap-3 rounded-xl border border-amber-500/35 bg-amber-500/5 p-4 text-sm leading-7 text-muted-foreground">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <div className="font-semibold text-foreground">تفعيل سجلات الحقوق ينتظر بوابة Staging مستقلة</div>
                  <p className="mt-1">يمكنك قراءة المصادر والمواد المرتبطة فقط. لا تحاول إضافة مصدر أو تعديل حقوق أو أرشفة روابط من هذه البيئة قبل تفعيل الطبقة رسميًا.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setRightsActivationDetailsOpen((value) => !value)}>
                  {rightsActivationDetailsOpen ? 'إخفاء حالة التفعيل' : 'عرض حالة التفعيل والمتطلبات'}
                  {rightsActivationDetailsOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                </Button>
                <span className="text-xs text-muted-foreground">لا تتغير حالة الحقوق أو المصادر بسبب فتح هذه الصفحة.</span>
              </div>
              {rightsActivationDetailsOpen ? (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                  <div className="font-medium text-foreground">ما الذي ينتظر التفعيل؟</div>
                  <p className="mt-1">Schema وRLS وRPC الخاصة بسجل الروابط وملفات الحقوق ضمن Mega Batch C، مع Preflight وقرار تطبيق منفصلين. هذا ليس عطلًا في AR1 ولا مهمة يمكن إكمالها من الواجهة الحالية.</p>
                  <div className="mt-3 text-xs">المعرّف التشخيصي: <code>{schemaReason || 'unknown'}</code></div>
                </div>
              ) : null}
            </div>
          </AdminCard>
        ) : null}

        {registry.data?.capability?.schemaReady && !access.data?.canManage ? (
          <AdminCard title="عرض فقط" description="تتطلب عمليات تغيير المصدر أو الحقوق صلاحية assistant.source.manage أو سلطة Super Admin.">
            <p className="text-sm text-muted-foreground">لا تؤثر القراءة أو فتح الرابط الأصلي على حالة المصدر أو المادة.</p>
          </AdminCard>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminCard title="إجمالي المصادر"><div className="text-3xl font-bold">{sourceSummary?.totalSources ?? 0}</div></AdminCard>
          <AdminCard title="مصادر نشطة"><div className="text-3xl font-bold">{sourceSummary?.activeSources ?? 0}</div></AdminCard>
          <AdminCard title="ملفات حقوق مسجلة"><div className="text-3xl font-bold">{sourceSummary?.sourcesWithRightsProfiles ?? 0}</div></AdminCard>
          <AdminCard title="تحتاج فحص حقوق"><div className="text-3xl font-bold">{sourceSummary?.sourcesWithRightsRisk ?? 0}</div></AdminCard>
          <AdminCard title="مواد مرتبطة"><div className="text-3xl font-bold">{sourceSummary?.linkedMaterials ?? 0}</div></AdminCard>
        </div>

        <AdminCard
          title="AR1 — التشغيل التجريبي الداخلي المحكوم"
          description="مسار تشغيل محدود ومؤقت لربط corpus داخلي صغير من C4، مع استشهادات ظاهرة وامتناع عند نقص الدليل."
          headerRight={<Badge variant="outline">داخلي فقط</Badge>}
        >
          <div className="space-y-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><Bot className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>لا تكتب جلسة AR1 أي مصدر أو حق أو chunks أو vectors، ولا تفتح Chat العام. أي اختيار للمواد يبقى مؤقتًا داخل ذاكرة الخادم وينتهي بالإلغاء أو بانقضاء المدة.</p></div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={pilotMaterialReady ? 'secondary' : 'outline'}>{pilotStatusCode || 'جارٍ فحص البوابة'}</Badge>
                <Badge variant="outline">LLM: {pilotStatus.data?.llmGenerationEnabled ? 'مفعّل داخليًا' : 'Evidence-only'}</Badge>
              </div>
            </div>

            {pilotStatus.isLoading || pilotCandidates.isLoading ? <p className="text-sm text-muted-foreground">جارٍ قراءة بوابة AR1 دون تشغيل أي فحص خارجي جديد…</p> : null}
            {pilotStatus.error || pilotCandidates.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm leading-7 text-destructive">تعذر قراءة بوابة AR1. لا تتابع إنشاء الجلسة حتى تعود حالة القراءة: {pilotStatus.error?.message || pilotCandidates.error?.message}</div> : null}

            {!pilotStatus.error && !pilotCandidates.error ? (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold">{pilotSession ? 'جلسة AR1 نشطة الآن' : pilotMaterialReady ? 'الخطوة المطلوبة الآن: توثيق الاستخدام وإنشاء الجلسة' : 'الخطوة المطلوبة الآن: C3 ثم قراءة C4'}</div>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{pilotSession ? 'اكتب سؤالًا بحثيًا داخليًا ضمن corpus المحدد، أو ألغ الجلسة لمسح الذاكرة المؤقتة.' : pilotMaterialReady ? 'اختر مادة واحدة أو أكثر من المواد الحتمية، ثم أدخل مراجع الحقوق والاستخدام الداخلي والإقرارات المطلوبة.' : pilotStatus.data?.reason || 'لا توجد مادة C4 حتمية قابلة للربط بعد. لا يستخدم AR1 المطابقة التقريبية أو الدلالية أو المتجهية.'}</p>
                    </div>
                  </div>
                  {!pilotSession && !pilotMaterialReady ? <Button variant="outline" onClick={openRequiredEvidenceStep}>{c3C4EvidenceReady ? 'عرض حالة C4 والمتطلبات' : 'فتح خطوة C3 المطلوبة'}<ChevronDown className="mr-2 h-4 w-4" /></Button> : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="مسار تشغيل AR1">
              {pilotWorkflowSteps.map((step) => {
                const isComplete = step.state === 'complete';
                const isCurrent = step.state === 'current' || step.state === 'ready';
                const stateLabel = isComplete ? 'مكتمل' : step.state === 'ready' ? 'جاهز' : step.state === 'current' ? 'المطلوب الآن' : 'مقفل مؤقتًا';
                return <div className={`rounded-xl border p-3 text-sm ${isComplete ? 'border-emerald-500/40 bg-emerald-500/5' : isCurrent ? 'border-primary/45 bg-primary/5' : 'border-border bg-muted/20'}`} key={step.number}>
                  <div className="flex items-center justify-between gap-2"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isComplete ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step.number}</span><Badge variant={isComplete ? 'secondary' : 'outline'}>{stateLabel}</Badge></div>
                  <div className="mt-3 font-medium">{step.title}</div><div className="mt-1 text-xs leading-6 text-muted-foreground">{step.detail}</div>
                </div>;
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="مؤشرات جاهزية AR1">
              <div className="rounded-xl border border-primary/35 bg-primary/5 p-3 text-sm"><div className="text-muted-foreground">مواد C4 القابلة للربط</div><div className="mt-1 text-2xl font-bold">{pilotCandidateCount}</div><div className="mt-1 text-xs text-muted-foreground">المؤشر الحاسم لبدء الجلسة</div></div>
              <div className="rounded-xl border p-3 text-sm"><div className="text-muted-foreground">حالة الأدلة</div><div className="mt-1 text-base font-semibold">{c3C4EvidenceReady ? 'متاحة للدورة الحالية' : 'HOLD'}</div><div className="mt-1 text-xs text-muted-foreground">C3 ثم C4 في دورة واحدة</div></div>
              <div className="rounded-xl border p-3 text-sm"><div className="text-muted-foreground">حد الوثائق</div><div className="mt-1 text-2xl font-bold">{pilotStatus.data?.maxBindings ?? 5}</div></div>
              <div className="rounded-xl border p-3 text-sm"><div className="text-muted-foreground">مدة الجلسة</div><div className="mt-1 text-2xl font-bold">{pilotStatus.data?.maxSessionMinutes ?? 30} د</div></div>
              <div className="rounded-xl border p-3 text-sm"><div className="text-muted-foreground">الجلسات النشطة</div><div className="mt-1 text-2xl font-bold">{pilotStatus.data?.activeSessions ?? 0}</div></div>
            </div>

            {!pilotSession && !pilotMaterialReady ? <div className="rounded-2xl border border-dashed bg-muted/20 p-5">
              <div className="flex items-start gap-3"><LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" /><div><h3 className="font-semibold">إنشاء جلسة AR1 غير متاح حاليًا</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">لا تظهر حقول اختيار الوثائق أو اعتماد الحقوق قبل تحقق أهلية مادة C4. هذا القفل مقصود ويحمي المسار من ربط غير حتمي أو استخدام بلا مرجع.</p></div></div>
              <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm"><div className="rounded-lg border bg-background p-3"><div className="font-medium">ما المطلوب؟</div><div className="mt-1 text-xs leading-6 text-muted-foreground">تشغيل C3 ثم قراءة C4 في العملية الخارجية نفسها.</div></div><div className="rounded-lg border bg-background p-3"><div className="font-medium">ما الذي لن يحدث؟</div><div className="mt-1 text-xs leading-6 text-muted-foreground">لا مطابقة تقريبية أو دلالية أو Vector، ولا إنشاء سجل مصدر أو حق.</div></div><div className="rounded-lg border bg-background p-3"><div className="font-medium">متى تظهر الحقول؟</div><div className="mt-1 text-xs leading-6 text-muted-foreground">بعد وجود مادة knowledge_document مباشرة أو تطابق حتمي دقيق.</div></div></div>
            </div> : null}

            {!pilotSession && pilotMaterialReady ? <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><div><h3 className="font-semibold">4. توثيق الاستخدام وإنشاء جلسة AR1</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">ابدأ بمادة واحدة في أول Pilot. لا تُنشئ المطابقة رابط مصدر دائمًا ولا تعيّن حقًا قانونيًا؛ المراجع التالية تخص الجلسة المؤقتة فقط.</p></div></div>
              <div className="space-y-3">
                {pilotCandidateRows.map((candidate: any) => {
                  const key = `${candidate.clusterKey}:${candidate.documentId}`;
                  const selection = pilotSelection[key] || { selected: false, evidenceTier: 'T3_CONTROLLED_INTERNAL_EVIDENCE', internalUseApprovalRef: '' };
                  return <div className="rounded-xl border bg-background p-3" key={key}>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-start gap-3"><Checkbox checked={selection.selected} onCheckedChange={(checked) => updatePilotSelection(candidate, { selected: checked === true })} /><div><div className="font-medium">{candidate.documentTitle}</div><div className="mt-1 text-xs text-muted-foreground">C4: {candidate.clusterTitle || candidate.clusterKey} · {candidate.category || 'غير مصنف'} · فحص C3: {candidate.c4CheckedAt || 'غير متاح'}</div>{candidate.resolutionLabel ? <div className="mt-1 text-xs text-muted-foreground">حل corpus: {candidate.resolutionLabel} · تأكيد المشغل مطلوب</div> : null}{candidate.sourceUrl ? <div className="mt-1 truncate text-xs text-muted-foreground">{candidate.sourceUrl}</div> : null}</div></div>
                      <div className="flex flex-wrap gap-2"><Badge variant="outline">{candidate.c4DispositionLabel}</Badge>{candidate.resolutionLabel ? <Badge variant="outline">{candidate.resolutionLabel}</Badge> : null}</div>
                    </div>
                    {selection.selected ? <div className="mt-3 grid gap-3 md:grid-cols-2"><div><Label>درجة الدليل للجلسة</Label><Select value={selection.evidenceTier} onValueChange={(value) => updatePilotSelection(candidate, { evidenceTier: value as PilotSelection['evidenceTier'] })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="T3_CONTROLLED_INTERNAL_EVIDENCE">T3 — دليل داخلي مضبوط</SelectItem><SelectItem value="T4_VERIFIED_CITATION_EVIDENCE">T4 — دليل استشهاد متحقق</SelectItem></SelectContent></Select></div><div><Label>مرجع اعتماد الاستخدام الداخلي</Label><Input className="mt-1" value={selection.internalUseApprovalRef} onChange={(event) => updatePilotSelection(candidate, { internalUseApprovalRef: event.target.value })} placeholder="مثال: AR1-INT-APPROVAL-001" /></div></div> : null}
                  </div>;
                })}
              </div>
              <div className="grid gap-3 md:grid-cols-2"><div><Label>مرجع اعتماد الحقوق/الاستخدام على مستوى الجلسة</Label><Input className="mt-1" value={pilotRightsApprovalRef} onChange={(event) => setPilotRightsApprovalRef(event.target.value)} placeholder="مرجع قرار داخلي قابل للتتبع" /></div><div><Label>ملاحظة المراجع (اختيارية)</Label><Input className="mt-1" value={pilotReviewerNote} onChange={(event) => setPilotReviewerNote(event.target.value)} placeholder="حدود الاستخدام أو سبب اختيار الوثائق" /></div></div>
              <div className="space-y-2 text-sm"><label className="flex items-start gap-3"><Checkbox checked={pilotInternalOnlyAcknowledged} onCheckedChange={(checked) => setPilotInternalOnlyAcknowledged(checked === true)} /><span>أقر أن هذه الجلسة للبحث الداخلي فقط، وليست نشرًا عامًا أو Chat عام أو قرارًا قانونيًا.</span></label><label className="flex items-start gap-3"><Checkbox checked={pilotModelBoundaryAcknowledged} onCheckedChange={(checked) => setPilotModelBoundaryAcknowledged(checked === true)} /><span>أقر أن مزود النموذج المحلي أو الداخلي المعتمد فقط هو المسموح به عند تفعيل التوليد النصي.</span></label></div>
              <div className="flex flex-wrap items-center gap-3"><Button onClick={() => startPilotSession.mutate({ bindings: selectedPilotBindings, rightsApprovalRef: pilotRightsApprovalRef, reviewerNote: pilotReviewerNote || null, acknowledgeInternalOnly: true, acknowledgeModelBoundary: true })} disabled={!pilotSessionApprovalReady || startPilotSession.isPending}><Play className="ml-2 h-4 w-4" />{startPilotSession.isPending ? 'جارٍ إنشاء الجلسة…' : 'إنشاء جلسة AR1 الداخلية'}</Button><span className="text-xs text-muted-foreground">{pilotSessionApprovalReady ? 'المدخلات مكتملة للجلسة المؤقتة.' : 'أكمل اختيار مادة، ومراجع الاستخدام، والإقرارات قبل إنشاء الجلسة.'}</span></div>
            </div> : null}

            {pilotSession ? <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><div className="font-semibold">5. جلسة AR1 نشطة</div><div className="mt-1 text-xs text-muted-foreground">{pilotSession.id} · تنتهي: {dateLabel(pilotSession.expiresAt)} · {pilotSession.bindingCount} مواد</div></div><Button variant="outline" onClick={() => rollbackPilot.mutate({ sessionId: pilotSession.id })} disabled={rollbackPilot.isPending}><RotateCcw className="ml-2 h-4 w-4" />إلغاء الجلسة ومسح الذاكرة</Button></div>
              <div className="rounded-lg border bg-background p-3 text-xs leading-6 text-muted-foreground">لا تُكتب نتائج الجلسة في قاعدة البيانات. سجل التنفيذ الظاهر أدناه موجود مؤقتًا في ذاكرة الخادم ويُحذف عند الإلغاء أو انتهاء الجلسة.</div>
              <div><Label>السؤال البحثي الداخلي</Label><Textarea className="mt-1" value={pilotQuestion} onChange={(event) => setPilotQuestion(event.target.value)} placeholder="اكتب سؤالًا عن النصوص أو العلاقات الظاهرة في corpus المختار…" /><div className="mt-2 flex flex-wrap items-center gap-2"><Button onClick={() => askPilot.mutate({ sessionId: pilotSession.id, question: pilotQuestion })} disabled={!pilotQuestion.trim() || askPilot.isPending}><Send className="ml-2 h-4 w-4" />{askPilot.isPending ? 'جارٍ فحص الأدلة…' : 'تنفيذ السؤال المقيد'}</Button><Badge variant="outline">{pilotStatus.data?.llmGenerationEnabled ? 'توليد داخلي محكوم عند توفر النموذج' : 'Evidence-only حتى تفعيل المتغير البيئي'}</Badge></div></div>
              {pilotResult ? <div className="space-y-3 rounded-lg border bg-background p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={pilotResult.action === 'answer' ? 'secondary' : 'outline'}>{pilotResult.action}</Badge><Badge variant="outline">ثقة: {pilotResult.confidence}</Badge>{(pilotResult.reasonCodes || []).map((reason: string) => <Badge key={reason} variant="outline">{reason}</Badge>)}</div><pre className="whitespace-pre-wrap font-sans text-sm leading-7">{pilotResult.answer}</pre><div className="space-y-2"><div className="font-medium text-sm">الاستشهادات المستعملة</div>{(pilotResult.citations || []).map((citation: any) => <div className="rounded-md border p-3 text-sm" key={citation.citationId}><div className="font-medium">{citation.citationId} · {citation.title}</div><div className="mt-1 text-xs text-muted-foreground">{citation.evidenceTier} · document={citation.documentId} · score={citation.relevanceScore}</div>{citation.sourceUrl ? <a className="mt-1 inline-block text-xs text-primary hover:underline" href={citation.sourceUrl} target="_blank" rel="noopener noreferrer">{citation.sourceUrl}</a> : null}</div>)}</div></div> : null}
              {pilotEvents.data?.events?.length ? <div className="space-y-2"><div className="font-medium text-sm">أثر التنفيذ المؤقت</div>{pilotEvents.data.events.map((event: any, index: number) => <div className="rounded-md border bg-background p-3 text-xs" key={`${event.at}:${index}`}><span className="font-medium">{event.type}</span> · {dateLabel(event.at)}<pre className="mt-1 overflow-auto whitespace-pre-wrap text-muted-foreground">{JSON.stringify(event.details, null, 2)}</pre></div>)}</div> : null}
            </div> : null}

            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-medium">ضوابط الربط والحماية</div><div className="mt-1 text-xs text-muted-foreground">المطابقة الحتمية فقط، مع عزل كامل عن Chat والنشر.</div></div><Button variant="ghost" size="sm" onClick={() => setPilotGovernanceOpen((value) => !value)}>{pilotGovernanceOpen ? 'إخفاء الضوابط' : 'عرض الضوابط'} {pilotGovernanceOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button></div>
              {pilotGovernanceOpen ? <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm md:grid-cols-2"><div><div className="font-medium">المسموح</div><ul className="mt-2 space-y-1 text-xs leading-6 text-muted-foreground"><li>مرجع C4 مباشر أو تطابق تام للعنوان أو الرابط القانوني.</li><li>اختيار صريح من المشغّل ومراجع T3/T4 واستخدام داخلي.</li><li>جلسة مؤقتة بحد أقصى {pilotStatus.data?.maxBindings ?? 5} مواد ولمدة {pilotStatus.data?.maxSessionMinutes ?? 30} دقيقة.</li></ul></div><div><div className="font-medium">الممنوع</div><ul className="mt-2 space-y-1 text-xs leading-6 text-muted-foreground"><li>مطابقة تقريبية أو دلالية أو Vector أو بالكاتب/الناشر فقط.</li><li>كتابة مصادر أو حقوق أو وثائق أو chunks أو embeddings أو vectors.</li><li>Chat عام أو Knowledge Release أو قرار قانوني أو نشر إنتاجي.</li></ul></div></div> : null}
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-medium">السجل التقني وحالة التفعيل</div><div className="mt-1 text-xs text-muted-foreground">تفاصيل الدعم الفني؛ ليست خطوة تشغيلية أولى للمشغّل.</div></div><Button variant="ghost" size="sm" onClick={() => setPilotTechnicalOpen((value) => !value)}>{pilotTechnicalOpen ? 'إخفاء التفاصيل' : 'عرض التفاصيل'} {pilotTechnicalOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button></div>
              {pilotTechnicalOpen ? <div className="rounded-xl border bg-muted/20 p-4 text-xs leading-7 text-muted-foreground"><div>AR1 status: <code>{pilotStatusCode || 'unknown'}</code></div><div>C3 evidence expiry: <code>{pilotStatus.data?.c3EvidenceExpiresAt || 'not_available'}</code></div><div>Corpus direct references: <code>{pilotStatus.data?.corpusResolution?.directC4MaterialReferences ?? 0}</code></div><div>Deterministic exact matches: <code>{pilotStatus.data?.corpusResolution?.deterministicExactMatches ?? 0}</code></div><div>Rejected fuzzy/ambiguous matches: <code>{pilotStatus.data?.corpusResolution?.rejectedFuzzyOrAmbiguousMatches ?? 0}</code></div></div> : null}
            </div>
          </div>
        </AdminCard>

        <AdminCard title="C4 — تصميم سجل المصدر المنضبط وبوابة الحقوق — قراءة فقط" description="يبني مخططات سجل مصدر مقترحة وعقد بوابات حقوق من عناقيد C2 دون إنشاء أي سجل أو ربط أو حق. لا يعيد تشغيل C3 ولا يحتفظ بنتائج الوصول الخارجي كاعتماد دائم.">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><Database className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>هذه طبقة تصميم وتشغيل حوكمي فقط: المخطط يحدد حقول سجل المصدر والبوابات اللازمة قبل أي كتابة مستقبلية. لا ينشئ مصدرًا، ولا يربط مادة، ولا يعيّن حقوقًا، ولا يفتح العرض العام أو Chat/RAG.</p></div>
              <Button variant="outline" onClick={() => setC4Open((value) => !value)}>{c4Open ? 'إخفاء تصميم C4' : 'عرض تصميم C4'} {c4Open ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button>
            </div>
            {controlledRegistryDesign.isLoading ? <p className="text-sm text-muted-foreground">جارٍ بناء مخططات السجل المنضبط وبوابات الحقوق…</p> : null}
            {controlledRegistryDesign.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">تعذر بناء تصميم C4: {controlledRegistryDesign.error.message}</div> : null}
            {c4Summary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مخططات سجل مقترحة</div><div className="mt-1 text-2xl font-bold">{c4Summary.proposedRegistryBlueprints}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مخططات رسمية</div><div className="mt-1 text-2xl font-bold">{c4Summary.officialBlueprints}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مخططات أكاديمية</div><div className="mt-1 text-2xl font-bold">{c4Summary.academicBlueprints}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مخططات مرجعية</div><div className="mt-1 text-2xl font-bold">{c4Summary.referenceBlueprints}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">دليل فقط بلا سجل</div><div className="mt-1 text-2xl font-bold">{c4Summary.evidenceOnlyClusters}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">حجر/استبعاد</div><div className="mt-1 text-2xl font-bold">{c4Summary.quarantinedClusters}</div></div>
            </div> : null}
            {c4Open && c4Summary ? <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm leading-7 text-muted-foreground dark:bg-amber-950/10"><strong>حد التصميم:</strong> لا توجد في C4 هجرة SQL أو إنشاء جداول أو إجراء كتابة. البوابات الست التالية تصف ما يجب إثباته قبل أي تطبيق منضبط لاحق: الهوية والنطاق، شروط وحقوق الاستخدام، إنشاء السجل، ربط المواد، العرض العام، ثم Chat/RAG.</div>
              <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={c4Search} onChange={(event) => setC4Search(event.target.value)} placeholder="بحث في اسم المصدر أو المجال أو الرابط المقترح…" /></div>
                <Select value={c4Disposition} onValueChange={setC4Disposition}><SelectTrigger><SelectValue placeholder="كل مخططات C4" /></SelectTrigger><SelectContent><SelectItem value="all">كل مخططات C4</SelectItem>{['OFFICIAL_REGISTRY_HOLD', 'ACADEMIC_REGISTRY_HOLD', 'REFERENCE_REGISTRY_HOLD'].map((entry) => <SelectItem key={entry} value={entry}>{entry} ({(controlledRegistryDesign.data?.registryBlueprints || []).filter((blueprint: any) => blueprint.designDisposition === entry).length})</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{(controlledRegistryDesign.data?.rightsGates || []).map((gate: any) => <div key={gate.code} className="rounded-lg border bg-background p-3 text-sm"><div className="font-medium">{gate.code}</div><div className="mt-1 text-xs leading-6 text-muted-foreground">{gate.purpose}</div><Badge className="mt-2" variant="outline">{gate.status}</Badge></div>)}</div>
              <div className="space-y-2">{c4Blueprints.map((blueprint: any) => <details className="rounded-lg border bg-background p-3" key={blueprint.candidateKey}><summary className="cursor-pointer list-none"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium">{blueprint.proposedSourceName || blueprint.domain || 'مخطط مصدر بلا عنوان'}</div><div className="mt-1 text-xs text-muted-foreground">{blueprint.rawRows} سجل خام · {blueprint.clusters.length} عنقود C2 · {blueprint.domain || 'نطاق غير متاح'}</div></div><div className="flex flex-wrap gap-2"><Badge variant={blueprint.designDisposition.includes('OFFICIAL') || blueprint.designDisposition.includes('ACADEMIC') ? 'secondary' : 'outline'}>{blueprint.designLabel}</Badge><Badge variant="outline">كتابة السجل: {blueprint.controlledRegistryWrite}</Badge></div></div></summary><div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-2"><div className="md:col-span-2"><span className="text-muted-foreground">الرابط القانوني المقترح: </span><a className="inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={blueprint.canonicalUrl} target="_blank" rel="noopener noreferrer"><span className="truncate">{blueprint.canonicalUrl}</span><ExternalLink className="h-3 w-3 shrink-0" /></a></div><div><span className="text-muted-foreground">تصنيف السلطة المقترح: </span>{blueprint.proposedAuthorityClass}</div><div><span className="text-muted-foreground">الحالة الافتراضية للحقوق: </span>{blueprint.proposedDefaults?.rightsStatus}</div><div><span className="text-muted-foreground">دلائل المؤلف: </span>{blueprint.authorEvidence?.join('، ') || '—'}</div><div><span className="text-muted-foreground">دلائل الناشر: </span>{blueprint.publisherEvidence?.join('، ') || '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">البوابة المطلوبة: </span><code>{blueprint.requiredNextGate}</code></div><div className="md:col-span-2 text-xs text-muted-foreground">قرار C4: إنشاء السجل={blueprint.controlledRegistryWrite} · ربط المصدر={blueprint.sourceLinkWrite} · الحقوق={blueprint.rightsAssignment} · العرض={blueprint.publicDisplay} · Chat/RAG={blueprint.chatRag} · الإتاحة={blueprint.finalRelease}</div></div></details>)}</div>
              {!c4Blueprints.length ? <p className="text-sm text-muted-foreground">لا توجد مخططات سجل C4 مطابقة للمرشح الحالي.</p> : null}
            </div> : null}
          </div>
        </AdminCard>

        <div id="c3-external-verification">
        <AdminCard title="C3 — التحقق الخارجي الآلي ومصفوفة الإتاحة النهائية — قراءة فقط" description="يفحص، عند طلبك فقط، روابط C2 الرسمية والأكاديمية والمرشحة ضمن سقف محدود، باستخدام DNS وHTTP headers/status فقط ودون قراءة أو تخزين محتوى الصفحات.">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>الفحص الخارجي لا يعمل تلقائيًا مع فتح الصفحة. عند تشغيله لا يتبع التحويلات، ولا يقرأ أو يخزن النصوص أو PDF، ويمنع عناوين الشبكات الخاصة. نجاح HTTP ليس ترخيصًا ولا اعتمادًا للناشر ولا إتاحة لـChat/RAG.</p></div>
              <Button variant="outline" disabled={externalVerification.isFetching} onClick={() => { setExternalOpen(true); void externalVerification.refetch(); }}>
                <RefreshCw className={`ml-2 h-4 w-4 ${externalVerification.isFetching ? 'animate-spin' : ''}`} />
                {externalVerification.isFetching ? 'جارٍ تشغيل فحص C3…' : externalSummary ? 'إعادة تشغيل فحص C3' : 'تشغيل فحص C3 الخارجي'}
              </Button>
            </div>
            {externalVerification.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">تعذر إتمام فحص C3 الخارجي: {externalVerification.error.message}</div> : null}
            {externalSummary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مرشحو C2 الخارجيون</div><div className="mt-1 text-2xl font-bold">{externalSummary.c2ExternalCandidates}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">فحوص منفذة</div><div className="mt-1 text-2xl font-bold">{externalSummary.requestedChecks}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">رسمي متاح وصفيًا</div><div className="mt-1 text-2xl font-bold">{externalSummary.matrixCounts?.OFFICIAL_URL_REACHABLE_METADATA_ONLY || 0}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">أكاديمي متاح وصفيًا</div><div className="mt-1 text-2xl font-bold">{externalSummary.matrixCounts?.ACADEMIC_URL_REACHABLE_METADATA_ONLY || 0}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">تعليق/تحقق لاحق</div><div className="mt-1 text-2xl font-bold">{Object.entries(externalSummary.matrixCounts || {}).filter(([key]) => !['OFFICIAL_URL_REACHABLE_METADATA_ONLY', 'ACADEMIC_URL_REACHABLE_METADATA_ONLY'].includes(key)).reduce((sum, [, value]) => sum + Number(value || 0), 0)}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">إتاحة نهائية</div><div className="mt-1 text-2xl font-bold">{externalSummary.finalReleaseAuthorized}</div></div>
            </div> : null}
            {externalOpen && externalSummary ? <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={externalSearch} onChange={(event) => setExternalSearch(event.target.value)} placeholder="بحث في العنوان أو الرابط أو قرار C3…" /></div>
                <Select value={externalDisposition} onValueChange={setExternalDisposition}><SelectTrigger><SelectValue placeholder="كل نتائج C3" /></SelectTrigger><SelectContent><SelectItem value="all">كل نتائج C3</SelectItem>{Object.keys(externalSummary.matrixCounts || {}).sort().map((entry) => <SelectItem key={entry} value={entry}>{entry} ({externalSummary.matrixCounts?.[entry] || 0})</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm leading-7 text-muted-foreground dark:bg-amber-950/10"><strong>مصفوفة الإتاحة النهائية:</strong> حتى نتائج الوصول الناجحة تبقى بيانات وصفية مرشحة فقط. ربط المصدر، تعيين الحقوق، العرض العام، وإتاحة Chat/RAG كلها محجوبة ببوابات مستقلة.</div>
              <div className="space-y-2">{externalEntries.map((entry: any) => <details className="rounded-lg border bg-background p-3" key={entry.clusterKey}><summary className="cursor-pointer list-none"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium">{entry.title || 'عنقود بلا عنوان'}</div><div className="mt-1 text-xs text-muted-foreground">{entry.rawRows} سجل خام · C2: {entry.c2DispositionLabel}</div></div><div className="flex flex-wrap gap-2"><Badge variant={entry.matrixDisposition.includes('REACHABLE') ? 'secondary' : entry.matrixDisposition.includes('SAFETY') ? 'destructive' : 'outline'}>{entry.matrixLabel}</Badge><Badge variant="outline">HTTP: {entry.probe?.statusCode ?? '—'}</Badge></div></div></summary><div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-2"><div className="md:col-span-2"><span className="text-muted-foreground">الرابط المفحوص: </span>{entry.requestedUrl ? <a className="inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={entry.requestedUrl} target="_blank" rel="noopener noreferrer"><span className="truncate">{entry.requestedUrl}</span><ExternalLink className="h-3 w-3 shrink-0" /></a> : '—'}</div><div><span className="text-muted-foreground">طريقة الفحص: </span>{entry.probe?.method || '—'}</div><div><span className="text-muted-foreground">نوع المحتوى: </span>{entry.probe?.contentType || '—'}</div><div><span className="text-muted-foreground">DNS: </span>{entry.probe?.dns?.ok ? 'public_only' : entry.probe?.dns?.reason || '—'}</div><div><span className="text-muted-foreground">تحويل مرصود: </span>{entry.probe?.redirectLocation || '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">مبررات القرار: </span>{entry.rationale?.join(' ')}</div><div className="md:col-span-2"><span className="text-muted-foreground">البوابة التالية: </span><code>{entry.finalReleaseMatrix?.requiredNextGate}</code></div><div className="md:col-span-2 text-xs text-muted-foreground">قرار C3: حفظ الدليل={String(entry.finalReleaseMatrix?.preserveRawEvidence)} · كتابة المصدر={entry.finalReleaseMatrix?.sourceLinkWrite} · الحقوق={entry.finalReleaseMatrix?.rightsAssignment} · العرض={entry.finalReleaseMatrix?.publicDisplay} · Chat/RAG={entry.finalReleaseMatrix?.chatRag} · الإتاحة={entry.finalReleaseMatrix?.finalRelease}</div></div></details>)}</div>
              {!externalEntries.length ? <p className="text-sm text-muted-foreground">لا توجد نتائج C3 مطابقة للمرشح الحالي.</p> : null}
            </div> : null}
          </div>
        </AdminCard>

        </div>

        <div id="c4-controlled-release-plan">
        <AdminCard title="C4 — اختيار المصادر المتحققة وخطة إطلاق معرفة محكومة — قراءة فقط" description="يحوّل C2 مع آخر دليل C3 حديث في ذاكرة الخادم إلى cohort تخطيطية صغيرة للبيانات الوصفية والاستشهادات فقط. لا يعيد C4 تشغيل فحص خارجي، ولا يكتب مصادر أو حقوقًا أو أهلية نشر/Chat.">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>كلمة «متحققة» هنا تعني حدًا تقنيًا ضيقًا: مرشح رسمي في C2 مع استجابة C3 حديثة وآمنة وصِفية فقط. لا تعني توثيق هوية الناشر أو الترخيص أو حق الاحتفاظ بالنص أو عرضه.</p></div>
              <Button variant="outline" onClick={async () => { setReleasePlanOpen((value) => !value); await controlledReleasePlan.refetch(); }}>{releasePlanOpen ? 'إخفاء خطة C4' : 'عرض خطة C4'} {releasePlanOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button>
            </div>
            {controlledReleasePlan.isLoading ? <p className="text-sm text-muted-foreground">جارٍ تجميع خطة C4 من C2 ودليل C3 المتاح…</p> : null}
            {controlledReleasePlan.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">تعذر بناء خطة C4: {controlledReleasePlan.error.message}</div> : null}
            {releasePlanSummary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">دليل C3</div><div className="mt-1 text-2xl font-bold">{releasePlanSummary.c3EvidenceStatus === 'available' ? 'حديث' : releasePlanSummary.c3EvidenceStatus === 'stale' ? 'منتهي' : 'غير متاح'}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">Cohort بيانات وصفية</div><div className="mt-1 text-2xl font-bold">{releasePlanSummary.controlledMetadataPilotCandidates}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مواد مرشحة بالخطة</div><div className="mt-1 text-2xl font-bold">{releasePlanSummary.controlledMetadataCandidateMaterials}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">تعليق رسمي/أكاديمي</div><div className="mt-1 text-2xl font-bold">{Number(releasePlanSummary.officialHolds || 0) + Number(releasePlanSummary.academicTermsHolds || 0)}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">تحتاج C3 أو نتيجة أخرى</div><div className="mt-1 text-2xl font-bold">{Number(releasePlanSummary.c3EvidenceRequiredHolds || 0) + Number(releasePlanSummary.externalMatrixHolds || 0)}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">إتاحة نهائية</div><div className="mt-1 text-2xl font-bold">{releasePlanSummary.finalReleaseAuthorized}</div></div>
            </div> : null}
            {releasePlanOpen && releasePlanSummary ? <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              {controlledReleasePlan.data?.c3Evidence?.status !== 'available' ? <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm leading-7 text-muted-foreground dark:bg-amber-950/10"><strong>بوابة C3 مطلوبة:</strong> لا توجد نتيجة C3 حديثة في ذاكرة الخادم. شغّل «تشغيل فحص C3 الخارجي» أولًا؛ C4 لن ينفذ فحص شبكة بدلًا عنه.</div> : <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm leading-7 text-muted-foreground dark:bg-amber-950/10"><strong>حد خطة C4:</strong> cohort المختارة هي خطة تحقق وإطلاق بيانات وصفية/استشهادات فقط. لا يوجد ربط مصدر أو حق أو عرض عام أو Chat/RAG أو نص كامل أو Production في هذه الدفعة.</div>}
              <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
                <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={releasePlanSearch} onChange={(event) => setReleasePlanSearch(event.target.value)} placeholder="بحث في العنوان أو قرار C4 أو الرابط أو المؤلف…" /></div>
                <Select value={releasePlanDisposition} onValueChange={setReleasePlanDisposition}><SelectTrigger><SelectValue placeholder="قرار C4" /></SelectTrigger><SelectContent><SelectItem value="all">كل قرارات C4</SelectItem>{(controlledReleasePlan.data?.byDisposition || []).map((entry: any) => <SelectItem key={entry.disposition} value={entry.disposition}>{entry.label} ({entry.groups})</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">{releasePlanEntries.map((entry: any) => <details className="rounded-lg border bg-background p-3" key={entry.clusterKey}><summary className="cursor-pointer list-none"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium">{entry.title || 'عنقود بلا عنوان'}</div><div className="mt-1 text-xs text-muted-foreground">{entry.rawRows} سجل خام · C2: {entry.c2DispositionLabel} · C3: {entry.c3MatrixLabel || 'غير متاح'}</div></div><div className="flex flex-wrap gap-2"><Badge variant={entry.disposition === 'CONTROLLED_METADATA_PILOT_CANDIDATE' ? 'secondary' : entry.disposition.includes('EXCLUDED') ? 'destructive' : 'outline'}>{entry.dispositionLabel}</Badge><Badge variant="outline">مواد: {entry.candidateMaterials?.length || 0}</Badge></div></div></summary><div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-2"><div className="md:col-span-2"><span className="text-muted-foreground">الرابط المرشح: </span>{entry.requestedUrl ? <a className="inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={entry.requestedUrl} target="_blank" rel="noopener noreferrer"><span className="truncate">{entry.requestedUrl}</span><ExternalLink className="h-3 w-3 shrink-0" /></a> : '—'}</div><div><span className="text-muted-foreground">المؤلفون: </span>{entry.authors?.join('، ') || '—'}</div><div><span className="text-muted-foreground">الناشرون: </span>{entry.publishers?.join('، ') || '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">المواد المرشحة: </span>{entry.candidateMaterials?.length ? entry.candidateMaterials.map((material: any) => <Badge className="ml-2" key={`${material.materialKind}:${material.id}`} variant="outline">{material.materialKind === 'reference_document' ? 'مرجع' : 'معرفة'}: {material.title || material.id}</Badge>) : '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">مبررات القرار: </span>{entry.rationale?.join(' ')}</div><div className="md:col-span-2"><span className="text-muted-foreground">البوابة التالية: </span><code>{entry.controlledReleasePlan?.requiredNextGate}</code></div><div className="md:col-span-2 text-xs text-muted-foreground">قرار C4: حفظ الدليل={String(entry.controlledReleasePlan?.preserveRawEvidence)} · كتابة المصدر={entry.controlledReleasePlan?.sourceLinkWrite} · الحقوق={entry.controlledReleasePlan?.rightsAssignment} · العرض={entry.controlledReleasePlan?.publicDisplay} · Chat/RAG={entry.controlledReleasePlan?.chatRag} · الإتاحة={entry.controlledReleasePlan?.finalRelease}</div></div></details>)}</div>
              {!releasePlanEntries.length ? <p className="text-sm text-muted-foreground">لا توجد عناقيد تحت قرار C4 المحدد. اختر «كل قرارات C4» لعرض سجل الخطة دون أي تغيير تشغيلي.</p> : null}
            </div> : null}
          </div>
        </AdminCard>

        </div>

        <AdminCard title="تدقيق C2 الآلي وقرار التصرف النهائي — قراءة فقط" description="يجمع الدليل الخام في عناقيد تشغيلية ويصدر قرارًا آليًا لكل مجموعة بدل مراجعة الصفوف الخام واحدًا واحدًا.">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>هذا التقرير يقرر طريقة التعامل مع دليل المنشأ فقط. لا ينشئ مصدرًا، ولا يربط مصدرًا، ولا يقرر ترخيصًا أو حقًا قانونيًا، ولا يغير أهلية Chat/RAG.</p></div>
              <Button variant="outline" onClick={() => setAuditOpen((value) => !value)}>{auditOpen ? 'إخفاء قرار C2' : 'عرض قرار C2 الآلي'} {auditOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button>
            </div>
            {autonomousAudit.isLoading ? <p className="text-sm text-muted-foreground">جارٍ تجميع أدلة Manus وإصدار القرار الآلي…</p> : null}
            {autonomousAudit.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">تعذر تنفيذ تدقيق C2 الآلي: {autonomousAudit.error.message}</div> : null}
            {auditSummary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">سجلات خام</div><div className="mt-1 text-2xl font-bold">{auditSummary.rawLegacyRows}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">عناقيد فريدة</div><div className="mt-1 text-2xl font-bold">{auditSummary.clusteredGroups}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">خفض الصفوف اليدوية</div><div className="mt-1 text-2xl font-bold">{auditSummary.rowReduction}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مرشح رسمي</div><div className="mt-1 text-2xl font-bold">{auditSummary.officialCandidates}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مرشح أكاديمي</div><div className="mt-1 text-2xl font-bold">{auditSummary.academicCandidates}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">حجر/تعارض</div><div className="mt-1 text-2xl font-bold">{auditSummary.quarantinedGroups + auditSummary.ambiguousGroups}</div></div>
            </div> : null}
            {auditOpen && auditSummary ? <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} placeholder="بحث في قرار المجموعة أو العنوان أو الرابط أو المؤلف…" /></div>
                <Select value={auditDisposition} onValueChange={setAuditDisposition}><SelectTrigger><SelectValue placeholder="كل القرارات" /></SelectTrigger><SelectContent><SelectItem value="all">كل القرارات</SelectItem>{(autonomousAudit.data?.byDisposition || []).map((entry: any) => <SelectItem key={entry.disposition} value={entry.disposition}>{entry.label} ({entry.groups})</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 p-3 text-sm leading-7 text-muted-foreground dark:bg-amber-950/10"><strong>القرار التشغيلي الثابت:</strong> تُحفظ الأدلة الخام، بينما يظل ربط المصدر وتعيين الحقوق والإتاحة في Chat/RAG محجوبًا في جميع الفئات إلى بوابة مستقلة.</div>
              <div className="space-y-2">{auditClusters.map((cluster: any) => <details className="rounded-lg border bg-background p-3" key={cluster.clusterKey}><summary className="cursor-pointer list-none"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium">{cluster.title || 'عنقود بلا عنوان'}</div><div className="mt-1 text-xs text-muted-foreground">{cluster.rawRows} سجل خام · {cluster.candidateMaterials?.length || 0} مادة مرشحة · {cluster.legacyTables?.join('، ') || 'جدول غير مسجل'}</div></div><div className="flex flex-wrap gap-2"><Badge variant={cluster.evidenceLevel === 'high' ? 'secondary' : cluster.evidenceLevel === 'quarantine' ? 'destructive' : 'outline'}>{cluster.dispositionLabel}</Badge><Badge variant="outline">دليل: {cluster.evidenceLevel}</Badge></div></div></summary><div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-2"><div><span className="text-muted-foreground">المؤلفون: </span>{cluster.authors?.join('، ') || '—'}</div><div><span className="text-muted-foreground">الناشرون: </span>{cluster.publishers?.join('، ') || '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">الروابط المرشحة: </span>{cluster.urls?.length ? cluster.urls.map((url: string) => <a key={url} className="ml-3 inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={url} target="_blank" rel="noopener noreferrer"><span className="truncate">{url}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>) : '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">مبررات القرار: </span>{cluster.rationale?.join(' ')}</div><div className="md:col-span-2"><span className="text-muted-foreground">البوابة التالية: </span><code>{cluster.finalOperationalDecision?.requiredNextGate}</code></div><div className="md:col-span-2 text-xs text-muted-foreground">قرار C2: حفظ الدليل={String(cluster.finalOperationalDecision?.preserveRawEvidence)} · كتابة المصدر={cluster.finalOperationalDecision?.sourceLinkWrite} · الحقوق={cluster.finalOperationalDecision?.rightsAssignment} · Chat/RAG={cluster.finalOperationalDecision?.chatRag}</div></div></details>)}</div>
              {!auditClusters.length ? <p className="text-sm text-muted-foreground">لا توجد مجموعات مطابقة للمرشح الحالي.</p> : null}
            </div> : null}
          </div>
        </AdminCard>

        <AdminCard title="استعادة منشأ Manus القديمة — قراءة فقط" description="تُظهر هذه الطبقة حقول المصدر والرابط والمؤلف والناشر المحفوظة داخل سجلات Manus القديمة، من دون تعديلها أو افتراض مصدر كنسي أو تغيير حقوق/دورة حياة أي مادة.">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground"><Database className="mt-1 h-5 w-5 shrink-0 text-primary" /><p>وعاء الترحيل KB08 ليس ناشرًا للمادة. هذا السجل يعرض دليل المنشأ الخام لكل سجل قديم ويترك أي تطبيع أو ربط نهائي لمراجعة بشرية محكومة.</p></div>
              <Button variant="outline" onClick={() => setLegacyOpen((value) => !value)}>{legacyOpen ? 'إخفاء أدلة Manus' : 'عرض أدلة Manus'} {legacyOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button>
            </div>
            {legacyReconciliation.isLoading ? <p className="text-sm text-muted-foreground">جارٍ قراءة أدلة Manus القديمة…</p> : null}
            {legacyReconciliation.error ? <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">تعذر تحميل أدلة Manus القديمة: {legacyReconciliation.error.message}</div> : null}
            {legacySummary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">سجلات قديمة</div><div className="mt-1 text-2xl font-bold">{legacySummary.legacyRows}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">لها دليل منشأ</div><div className="mt-1 text-2xl font-bold">{legacySummary.rowsWithRecoverableEvidence}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">روابط HTTP(S)</div><div className="mt-1 text-2xl font-bold">{legacySummary.rawHttpUrls}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مطابقة قوية</div><div className="mt-1 text-2xl font-bold">{legacySummary.matchedHigh}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">مطابقة مرشحة</div><div className="mt-1 text-2xl font-bold">{legacySummary.matchedMedium}</div></div>
              <div className="rounded-lg border p-3 text-sm"><div className="text-muted-foreground">تحتاج فصل/مراجعة</div><div className="mt-1 text-2xl font-bold">{legacySummary.matchedAmbiguous + legacySummary.unmatched}</div></div>
            </div> : null}
            {legacyOpen && legacySummary ? <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="font-semibold">سجل أدلة المنشأ الخام</div><div className="relative w-full sm:max-w-sm"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={legacySearch} onChange={(event) => setLegacySearch(event.target.value)} placeholder="بحث في العنوان أو المصدر أو الرابط أو الناشر…" /></div></div>
              <p className="text-xs leading-6 text-muted-foreground">تظهر المطابقة كدليل ترشيحي فقط: لا تنشئ رابطًا جديدًا، ولا تضبط حقوقًا، ولا تغيّر أهلية المحادثة.</p>
              <div className="space-y-2">{legacyItems.map((item: any) => <details className="rounded-lg border bg-background p-3" key={item.legacyId}><summary className="cursor-pointer list-none"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="font-medium">{item.title || item.legacyRecordKey || 'سجل قديم بلا عنوان'}</div><div className="mt-1 truncate text-xs text-muted-foreground">{item.legacyTableName || 'unknown'} · {item.legacySourceFile || 'legacy file غير مسجل'}</div></div><div className="flex flex-wrap gap-2"><Badge variant={item.hasEvidence ? 'secondary' : 'outline'}>{item.hasEvidence ? 'دليل منشأ موجود' : 'لا يظهر دليل قابل للاستعادة'}</Badge><Badge variant={item.mapping.confidence === 'high' ? 'secondary' : item.mapping.confidence === 'ambiguous' ? 'destructive' : 'outline'}>مطابقة: {item.mapping.confidence}</Badge></div></div></summary><div className="mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-2"><div><span className="text-muted-foreground">المصدر الخام: </span>{item.raw.source || '—'}</div><div><span className="text-muted-foreground">المؤلف: </span>{item.raw.author || '—'}</div><div><span className="text-muted-foreground">الناشر: </span>{item.raw.publisher || '—'}</div><div><span className="text-muted-foreground">طريقة المطابقة: </span>{item.mapping.method}</div><div className="md:col-span-2"><span className="text-muted-foreground">الروابط الأصلية: </span>{item.raw.urls.length ? item.raw.urls.map((url: string) => <a key={url} className="ml-3 inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={url} target="_blank" rel="noopener noreferrer"><span className="truncate">{url}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>) : '—'}</div><div className="md:col-span-2"><span className="text-muted-foreground">المواد الحالية المرشحة: </span>{item.mapping.materials.length ? item.mapping.materials.map((material: any) => <Badge className="ml-2" key={`${material.materialKind}:${material.id}`} variant="outline">{material.materialKind === 'reference_document' ? 'مرجع' : 'معرفة'}: {material.title || material.id}</Badge>) : 'لا توجد مطابقة آمنة بعد'}</div><div className="md:col-span-2 text-xs text-muted-foreground">مسارات الدليل: {[...item.raw.evidencePaths.source, ...item.raw.evidencePaths.sourceUrl, ...item.raw.evidencePaths.url, ...item.raw.evidencePaths.pdfUrl, ...item.raw.evidencePaths.author, ...item.raw.evidencePaths.publisher].filter((value: string, index: number, all: string[]) => all.indexOf(value) === index).join(' · ') || 'غير مسجلة'}</div></div></details>)}</div>
            </div> : null}
          </div>
        </AdminCard>
      </div>

      <div className="space-y-3">
        {sources.map((source: RegistrySource) => {
          const isOpen = expanded.has(source.id);
          const rightsStatus = source.rights?.rights_status || 'unknown';
          return (
            <AdminCard key={source.id} title={source.name} description={source.description || 'لا يوجد وصف محفوظ للمصدر.'}>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={source.isActive ? 'secondary' : 'outline'}>{source.isActive ? 'نشط' : 'مؤرشف / غير نشط'}</Badge>
                    <Badge variant="outline">توثيق المصدر: {source.verificationStatus}</Badge>
                    <Badge variant={riskVariant(rightsStatus)}>الحقوق: {RIGHTS_LABELS[rightsStatus] || rightsStatus}</Badge>
                    <Badge variant="outline">RAG: {RAG_LABELS[source.rights?.rag_eligibility] || 'مراجعة فقط'}</Badge>
                    <Badge variant="outline">{source.materialCounts.total} مادة مرتبطة</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {source.baseUrl ? <Button variant="outline" size="sm" asChild><a href={source.baseUrl} target="_blank" rel="noopener noreferrer">فتح المصدر <ExternalLink className="mr-2 h-4 w-4" /></a></Button> : null}
                    <Button variant="outline" size="sm" onClick={() => toggle(source.id)}>{isOpen ? 'إخفاء المواد' : 'عرض المواد'} {isOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(source)} disabled={!canManage}><Pencil className="ml-2 h-4 w-4" /> تعديل</Button>
                    <Button variant="outline" size="sm" onClick={() => setArchiveTarget(source)} disabled={!canManage || !source.isActive}><Archive className="ml-2 h-4 w-4" /> أرشفة</Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                  <div><span className="text-muted-foreground">الناشر: </span>{source.rights?.publisher_name || 'غير مسجل'}</div>
                  <div><span className="text-muted-foreground">صاحب الحق: </span>{source.rights?.rights_holder_name || 'غير مسجل'}</div>
                  <div><span className="text-muted-foreground">سياسة العرض: </span>{DISPLAY_LABELS[source.rights?.public_display_eligibility] || 'بيانات وصفية فقط'}</div>
                  <div><span className="text-muted-foreground">آخر تحديث: </span>{dateLabel(source.updatedAt)}</div>
                </div>

                {isOpen ? (
                  <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> سجل الروابط</div>
                      {source.urlHistory.length ? (
                        <div className="space-y-2">
                          {source.urlHistory.map((entry: any) => <div className="flex flex-col gap-1 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center sm:justify-between" key={entry.id}>
                            <div className="min-w-0"><a className="inline-flex max-w-full items-center gap-1 text-primary hover:underline" href={entry.url} target="_blank" rel="noopener noreferrer"><span className="truncate">{entry.url}</span><ExternalLink className="h-3 w-3 shrink-0" /></a><div className="mt-1 text-xs text-muted-foreground">{entry.url_role} · {entry.url_status} · {dateLabel(entry.created_at)}</div></div>
                            {entry.is_current ? <Badge variant="secondary">الحالي</Badge> : <Badge variant="outline">تاريخي</Badge>}
                          </div>)}
                        </div>
                      ) : <p className="text-sm text-muted-foreground">لم يُنشأ سجل رابط تاريخي بعد. لا يعني ذلك غياب الرابط الحالي من سجل المصدر.</p>}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4" /> المواد المرتبطة بالمصدر</div>
                      {source.materials.length ? <div className="space-y-2">{source.materials.map((material: any) => <div className="rounded-lg border bg-background p-3" key={`${material.materialType}:${material.id}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="font-medium">{material.title}</div><div className="flex gap-2"><Badge variant="outline">{material.materialType === 'reference_document' ? 'مرجع أصلي' : 'معرفة مشتقة'}</Badge><Badge variant="outline">{material.status}</Badge></div></div>
                        <div className="mt-1 text-xs text-muted-foreground">آخر تحديث: {dateLabel(material.updated_at)} · {material.materialType === 'reference_document' ? material.verification_status || 'pending' : material.is_chat_eligible ? 'مؤشر أهلية محادثة موجود — لا يغني عن بوابة الثقة' : 'غير مؤهل للمحادثة'}</div>
                      </div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد مواد مرجعية أو معرفة مشتقة مرتبطة بهذا المصدر بالمعرّف السيادي حاليًا.</p>}
                    </div>
                  </div>
                ) : null}
              </div>
            </AdminCard>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>التعديل يحفظ تاريخ الرابط السابق ولا يغيّر اعتماد المواد أو أهليتها للمحادثة.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2"><Label>اسم المصدر *</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="space-y-2"><Label>الرابط الحالي *</Label><Input dir="ltr" value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} /></div>
            <div className="space-y-2"><Label>مستوى السلطة</Label><Select value={form.authorityLevel} onValueChange={(value: any) => setForm({ ...form, authorityLevel: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="official">رسمي</SelectItem><SelectItem value="semi_official">شبه رسمي</SelectItem><SelectItem value="reference">مرجعي</SelectItem><SelectItem value="unverified">غير متحقق</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between rounded-lg border p-3"><div><Label>المصدر نشط</Label><p className="text-xs text-muted-foreground">إيقافه لا يحذف تاريخ الإسناد.</p></div><Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>وصف المصدر</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
            {form.sourceId ? <div className="space-y-2 sm:col-span-2"><Label>سبب التعديل *</Label><Textarea value={form.changeReason} onChange={(event) => setForm({ ...form, changeReason: event.target.value })} placeholder="مثال: تغيّر الرابط الرسمي أو تحديث ملف الحقوق." /></div> : null}
          </div>
          <div className="border-t pt-4"><div className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> ملف حقوق الناشر</div><div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>حالة الحقوق</Label><Select value={form.rightsStatus} onValueChange={(value: any) => setForm({ ...form, rightsStatus: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(RIGHTS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>الناشر</Label><Input value={form.publisherName} onChange={(event) => setForm({ ...form, publisherName: event.target.value })} /></div>
            <div className="space-y-2"><Label>صاحب الحق</Label><Input value={form.rightsHolderName} onChange={(event) => setForm({ ...form, rightsHolderName: event.target.value })} /></div>
            <div className="space-y-2"><Label>نوع الترخيص</Label><Input value={form.licenseType} onChange={(event) => setForm({ ...form, licenseType: event.target.value })} /></div>
            <div className="space-y-2"><Label>رابط الترخيص</Label><Input dir="ltr" value={form.licenseUrl} onChange={(event) => setForm({ ...form, licenseUrl: event.target.value })} /></div>
            <div className="space-y-2"><Label>رابط شروط الاستخدام</Label><Input dir="ltr" value={form.termsUrl} onChange={(event) => setForm({ ...form, termsUrl: event.target.value })} /></div>
            <div className="space-y-2"><Label>أهلية RAG</Label><Select value={form.ragEligibility} onValueChange={(value: any) => setForm({ ...form, ragEligibility: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(RAG_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>سياسة العرض</Label><Select value={form.publicDisplayEligibility} onValueChange={(value: any) => setForm({ ...form, publicDisplayEligibility: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DISPLAY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>نص النسبة المطلوب</Label><Textarea value={form.attributionText} onChange={(event) => setForm({ ...form, attributionText: event.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>مرجع الإذن أو الترخيص</Label><Input value={form.permissionReference} onChange={(event) => setForm({ ...form, permissionReference: event.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>ملاحظات الحقوق والمراجعة</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
          </div></div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? 'جارٍ الحفظ…' : 'حفظ سجل المصدر'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>أرشفة المصدر بدل حذفه</DialogTitle><DialogDescription>الأرشفة توقف المصدر وتحافظ على تاريخ الروابط والمواد المرتبطة لأغراض الإسناد والتدقيق.</DialogDescription></DialogHeader><div className="space-y-2"><Label>سبب الأرشفة *</Label><Textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setArchiveTarget(null)}>إلغاء</Button><Button variant="destructive" onClick={confirmArchive} disabled={archive.isPending}><AlertTriangle className="ml-2 h-4 w-4" /> أرشفة المصدر</Button></DialogFooter></DialogContent>
      </Dialog>
    </AdminPage>
  );
}
