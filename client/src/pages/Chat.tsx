import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// ScrollArea removed - using plain div with overflow-y-auto
import { trpc } from "@/lib/trpc";
import { getAppHref } from "@/const";
import { ArrowRight, ArrowUp, BookOpen, Bot, Brain, Copy, Download, FileSearch, FileText, FlaskConical, Loader2, MessageSquare, Mic, MicOff, Paperclip, Plus, Scale, Search, Send, Sparkles, Trash2, UserCog, Volume2, VolumeX, Wand2, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { ReferencesDisplay } from "@/components/ReferencesDisplay";
import { TypingIndicator } from "@/components/TypingIndicator";
import { MessageRating } from "@/components/MessageRating";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { exportConversationToPDF } from "@/lib/exportPDF";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { Keyboard } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { cn } from "@/lib/utils";

type SmartToolMode = "summarize" | "extract" | "classify";

type AssistantPlaybook = {
  title: string;
  description: string;
  prompt: string;
  category: "general" | "legal" | "jurisprudence" | "administrative" | "historical";
  icon: LucideIcon;
};

const assistantPlaybooks: AssistantPlaybook[] = [
  {
    title: "اختبار سؤال قانوني",
    description: "يتحقق من بناء جواب قانوني موجز ومنظم.",
    prompt: "اشرح لي بإيجاز منظم ما هي المبادئ الأساسية التي يجب مراعاتها عند إدارة وقف عقاري في فلسطين؟",
    category: "legal",
    icon: Scale,
  },
  {
    title: "اختبار سؤال فقهي",
    description: "لفحص الصياغة الفقهية ووضوح الترتيب.",
    prompt: "ما الفرق بين الوقف الخيري والوقف الذري، وكيف ينعكس ذلك على الإدارة والنظارة؟",
    category: "jurisprudence",
    icon: Brain,
  },
  {
    title: "اختبار مسار البحث",
    description: "لفحص قدرته على التوجيه إلى البحث والمعرفة المناسبة.",
    prompt: "أريد خطة قصيرة للبحث عن وثائق ومراجع مرتبطة بوقف أرض زراعية متنازع عليها.",
    category: "general",
    icon: FileSearch,
  },
  {
    title: "اختبار التلخيص الإداري",
    description: "لفحص التلخيص التنفيذي للمحتوى الإداري.",
    prompt: "لخّص لي الخطوات الإدارية الأساسية لتوثيق أصل وقفي جديد بصياغة تنفيذية قصيرة.",
    category: "administrative",
    icon: FileText,
  },
  {
    title: "اختبار قراءة وثيقة",
    description: "مناسب بعد رفع ملف أو لصق نص طويل داخل المساعد.",
    prompt: "حلل هذا النص وحدد أهم النقاط القانونية والإدارية والجهات ذات العلاقة بصياغة منظمة.",
    category: "general",
    icon: Wand2,
  },
  {
    title: "اختبار سياق تاريخي",
    description: "لفحص الردود التي تمزج التاريخ بالإدارة الحالية.",
    prompt: "كيف يمكن ربط الخلفية التاريخية لوقف قديم مع الحاجة إلى توثيقه وإدارته ضمن منصة حديثة؟",
    category: "historical",
    icon: Bot,
  },
];

const smartToolMeta: Record<SmartToolMode, { label: string; description: string; icon: LucideIcon }> = {
  summarize: {
    label: "أداة التلخيص",
    description: "تلخيص نص طويل إلى خلاصة منظمة ونقاط رئيسية.",
    icon: FileText,
  },
  extract: {
    label: "أداة الاستخراج",
    description: "استخراج كيانات ونقاط رئيسية وإشارات قانونية من النص.",
    icon: FlaskConical,
  },
  classify: {
    label: "أداة التصنيف",
    description: "اقتراح تصنيف المستند وفئته ودرجة الثقة.",
    icon: Brain,
  },
};

type ToolSample = {
  title: string;
  text: string;
};

type EvaluationStatus = "pass" | "review" | "fail";

type EvaluationEntry = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  response: string;
  status: EvaluationStatus;
  notes: string;
  createdAt: string;
};

const smartToolSamples: Record<SmartToolMode, ToolSample[]> = {
  summarize: [
    {
      title: "قرار إداري قصير",
      text: "باشرت اللجنة المختصة مراجعة ملف الوقف بعد ورود ملاحظات على البيانات الأساسية للأصل الوقفي. وتقرر استكمال النواقص في الحقول المرجعية، ثم إحالة الملف إلى المراجعة القانونية قبل اعتماده نهائيًا داخل النظام.",
    },
    {
      title: "وصف وثيقة أطول",
      text: "تشير المراسلات إلى وجود حاجة لتوحيد المرجعيات بين بيانات الوقف وبيانات الأصل الوقفي العيني، مع ربط أوضح بين الوثائق والملاحظات والإجراءات الإدارية، وتحديد الجهة المختصة بالمراجعة النهائية قبل الإقرار. كما أوصت المذكرة بإنشاء مسار تتبّع يبيّن حالة الملف من الاستلام حتى الاعتماد.",
    },
  ],
  extract: [
    {
      title: "نص لاستخراج النقاط",
      text: "ورد في المذكرة أن أصل الوقف يقع ضمن حدود تجمع محلي محدد، وأنه مرتبط بإجراءات توثيق ومراجعة قانونية، مع وجود حاجة إلى التحقق من اسم الوقف المرجعي، والوثائق الداعمة، والجهة المشرفة، والتوصية النهائية الخاصة بالاعتماد.",
    },
    {
      title: "مقتطف قانوني إداري",
      text: "تقرر إحالة الملف إلى الإدارة القانونية لاستكمال التحقق من حجية المستندات، والتأكد من سلامة بيانات الوقف، ورفع توصية للإدارة العليا بخصوص اعتماد الأصل الوقفي وربطه بالمرجعيات ذات الصلة.",
    },
  ],
  classify: [
    {
      title: "تصنيف مذكرة",
      text: "هذه مذكرة داخلية تتعلق باستكمال المراجعة الإدارية والقانونية لملف أصل وقفي جديد قبل اعتماده في النظام وربطه بالمراجع الأساسية.",
    },
    {
      title: "تصنيف محتوى تاريخي",
      text: "يعرض النص خلفية تاريخية عن تطور الوقف في المنطقة وعلاقته بالتقسيمات الإدارية المتعاقبة، مع الإشارة إلى كيفية الاستفادة من ذلك في الفهم الحديث للمرجعية الوقفية.",
    },
  ],
};

const evaluationStatusMeta: Record<EvaluationStatus, { label: string; className: string }> = {
  pass: { label: "ناجح", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  review: { label: "يحتاج مراجعة", className: "bg-amber-100 text-amber-700 border-amber-200" },
  fail: { label: "غير مقنع", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [smartToolMode, setSmartToolMode] = useState<SmartToolMode>("summarize");
  const [smartToolTitle, setSmartToolTitle] = useState("");
  const [smartToolInput, setSmartToolInput] = useState("");
  const [smartToolResult, setSmartToolResult] = useState<any | null>(null);
  const [smartToolError, setSmartToolError] = useState<string | null>(null);
  const [activePlaybookTitle, setActivePlaybookTitle] = useState<string | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>("review");
  const [evaluationNotes, setEvaluationNotes] = useState("");
  const [evaluationEntries, setEvaluationEntries] = useState<EvaluationEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const extractTextMutation = trpc.file.extractText.useMutation();
  
  // Voice Assistant hooks
  const voiceInput = useVoiceInput();
  const textToSpeech = useTextToSpeech();

  // Handle URL parameters (message from Home page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMessage = params.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
      setLocation('/chat');
    }
  }, [setLocation]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("palwakf-assistant-evaluations");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setEvaluationEntries(parsed);
      }
    } catch (error) {
      console.warn("Failed to restore assistant evaluations", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("palwakf-assistant-evaluations", JSON.stringify(evaluationEntries));
  }, [evaluationEntries]);

  const handleExportPDF = () => {
    if (!conversationData?.messages) return;
    
    const messages = conversationData.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      references: msg.references,
    }));
    
    const title = conversationData.conversation.title || "محادثة جديدة";
    exportConversationToPDF(messages, title);
  };

  const { data: conversations, refetch: refetchConversations } = trpc.chat.myConversations.useQuery();
  const { data: providerHealth } = trpc.health.llm.useQuery(undefined, { refetchInterval: 30000 });
  
  // Filter conversations based on search query
  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (conv.title || "محادثة جديدة").toLowerCase();
    return title.includes(query);
  });
  const { data: conversationData, refetch: refetchMessages } = trpc.chat.getConversation.useQuery(
    { id: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const [researchMode, setResearchMode] = useState<"answer" | "deep_research">("answer");
  const summarizeToolMutation = trpc.aiTools.summarize.useMutation();
  const extractToolMutation = trpc.aiTools.extract.useMutation();
  const classifyToolMutation = trpc.aiTools.classify.useMutation();
  const saveToolDraftMutation = trpc.aiTools.saveAsKnowledgeDraft.useMutation();
  
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      refetchConversations();
      if (currentConversationId === deletingConversationId) {
        setCurrentConversationId(null);
      }
      setDeletingConversationId(null);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Auto-read assistant's latest message if enabled
    if (conversationData?.messages && textToSpeech.isEnabled) {
      const messages = conversationData.messages;
      const lastMessage = messages[messages.length - 1];
      
      // Only read if it's an assistant message and not already speaking
      if (lastMessage?.role === 'assistant' && !textToSpeech.isSpeaking) {
        textToSpeech.speak(lastMessage.content);
      }
    }
  }, [conversationData?.messages, textToSpeech.isEnabled]);

  // Monitor scroll position for back-to-top button
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Show button when scrolled down more than 300px
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter: Send message
      if (e.ctrlKey && e.key === 'Enter' && message.trim() && !isSubmitting) {
        e.preventDefault();
        handleSendMessage(e as any);
      }
      
      // Esc: Close uploaded file or command palette or shortcuts dialog
      if (e.key === 'Escape') {
        if (uploadedFile) {
          e.preventDefault();
          setUploadedFile(null);
          setExtractedText("");
        } else if (showCommandPalette) {
          e.preventDefault();
          setShowCommandPalette(false);
        } else if (showShortcutsDialog) {
          e.preventDefault();
          setShowShortcutsDialog(false);
        }
      }
      
      // / or Ctrl+K: Open command palette (only if not typing in input)
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && 
          !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Ctrl+/: Show shortcuts dialog
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcutsDialog(true);
      }
      
      // Ctrl+N: New conversation
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
      
      // Ctrl+D: Delete current conversation
      if (e.ctrlKey && e.key === 'd' && currentConversationId) {
        e.preventDefault();
        setDeletingConversationId(currentConversationId);
      }
      
      // Ctrl+F: Focus search input
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="بحث"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setIsSidebarVisible(prev => !prev);
      }
      
      // Alt+H: Go to home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        setLocation('/');
      }
      
      // Alt+K: Go to knowledge
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        setLocation('/knowledge-base');
      }
      
      // Alt+F: Go to FAQs
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        setLocation('/faqs');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, currentConversationId, isSubmitting, uploadedFile, showCommandPalette, showShortcutsDialog, setLocation]);

  const handleNewConversation = async (category: "general" | "legal" | "jurisprudence" | "administrative" | "historical" = "general") => {
    setChatError(null);
    try {
      console.debug("[chat] creating conversation");
      const newConv = await createConversationMutation.mutateAsync({
        category,
      });
      setCurrentConversationId(newConv.id);
      await refetchConversations();
      return newConv.id;
    } catch (error: any) {
      console.error("[chat] Failed to create conversation:", error);
      setChatError(error?.message || error?.data?.message || "فشل إنشاء المحادثة الجديدة");
      return null;
    }
  };

  const submitMessageContent = async (
    rawMessage: string,
    options?: { includeUploaded?: boolean; category?: "general" | "legal" | "jurisprudence" | "administrative" | "historical" }
  ) => {
    const baseMessage = rawMessage.trim();
    if (!baseMessage || isSubmitting) return;

    setChatError(null);
    textToSpeech.stop();
    setIsSubmitting(true);

    const includeUploaded = options?.includeUploaded !== false;
    let targetConversationId = currentConversationId;
    let composedMessage = baseMessage;

    if (includeUploaded && uploadedFile && extractedText) {
      composedMessage = `${baseMessage}

[ملف مرفق: ${uploadedFile.name}]
${extractedText}`;
    }

    setMessage("");
    if (includeUploaded) {
      setUploadedFile(null);
      setExtractedText("");
    }

    try {
      if (!targetConversationId) {
        targetConversationId = await handleNewConversation(options?.category || "general");
      }

      if (!targetConversationId) {
        throw new Error("تعذر إنشاء المحادثة قبل إرسال الرسالة");
      }

      setCurrentConversationId(targetConversationId);
      console.debug("[chat] sending message", { conversationId: targetConversationId, messageLength: composedMessage.length });
      await sendMessageMutation.mutateAsync({
        conversationId: targetConversationId,
        message: composedMessage,
        mode: researchMode,
      });
      await refetchConversations();
      setTimeout(() => {
        refetchMessages();
      }, 50);
    } catch (error: any) {
      console.error("[chat] Failed to send message:", error);
      const visibleError = error?.message || error?.data?.message || error?.shape?.message || "فشل إرسال الرسالة أو توليد الرد";
      setChatError(visibleError);
      setMessage(baseMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessageContent(message, { includeUploaded: true, category: "general" });
  };

  const handlePlaybookRun = async (
    prompt: string,
    category: "general" | "legal" | "jurisprudence" | "administrative" | "historical",
    title?: string
  ) => {
    setActivePlaybookTitle(title || null);
    setMessage(prompt);
    await submitMessageContent(prompt, { includeUploaded: false, category });
  };

  const runSmartTool = async () => {
    const sourceText = smartToolInput.trim();
    if (!sourceText) {
      setSmartToolError("أدخل نصًا لاختبار الأداة الذكية.");
      return;
    }

    setSmartToolError(null);
    setSmartToolResult(null);

    try {
      if (smartToolMode === "summarize") {
        const result = await summarizeToolMutation.mutateAsync({
          text: sourceText,
          title: smartToolTitle.trim() || undefined,
          maxLength: "medium",
        });
        setSmartToolResult(result);
        return;
      }

      if (smartToolMode === "extract") {
        const result = await extractToolMutation.mutateAsync({
          text: sourceText,
          title: smartToolTitle.trim() || undefined,
        });
        setSmartToolResult(result);
        return;
      }

      const result = await classifyToolMutation.mutateAsync({
        text: sourceText,
        title: smartToolTitle.trim() || undefined,
      });
      setSmartToolResult(result);
    } catch (error: any) {
      setSmartToolError(error?.message || error?.data?.message || "تعذر تشغيل الأداة الذكية. قد تكون هذه الأداة متاحة للمشرفين فقط.");
    }
  };

  const getSmartToolResultText = () => {
    if (!smartToolResult) return "";

    if (smartToolMode === "summarize") {
      const summary = smartToolResult.summary || smartToolResult.shortSummary || "";
      const keyPoints = Array.isArray(smartToolResult.keyPoints)
        ? smartToolResult.keyPoints.map((item: string) => `- ${item}`).join("\n")
        : "";
      return [summary, keyPoints].filter(Boolean).join("\n\n");
    }

    if (smartToolMode === "extract") {
      const keyPoints = Array.isArray(smartToolResult.keyPoints)
        ? smartToolResult.keyPoints.map((item: string) => `- ${item}`).join("\n")
        : "";
      const legalTopics = Array.isArray(smartToolResult.legalTopics)
        ? smartToolResult.legalTopics.map((item: string) => `- ${item}`).join("\n")
        : "";
      return [
        keyPoints ? `النقاط الرئيسية:\n${keyPoints}` : "",
        legalTopics ? `الإشارات القانونية:\n${legalTopics}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    return [
      `الفئة المقترحة: ${smartToolResult.category || "-"}`,
      smartToolResult.subcategory ? `فئة فرعية: ${smartToolResult.subcategory}` : "",
      typeof smartToolResult.confidence === "number"
        ? `درجة الثقة: ${Math.round(smartToolResult.confidence * 100)}%`
        : "",
      Array.isArray(smartToolResult.tags) && smartToolResult.tags.length
        ? `الكلمات المفتاحية: ${smartToolResult.tags.join("، ")}`
        : "",
      smartToolResult.reasoning ? `ملاحظات: ${smartToolResult.reasoning}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const useToolResultInChat = () => {
    const next = getSmartToolResultText();
    if (!next) return;
    setMessage(next);
  };

  const saveToolResultAsKnowledgeDraft = async () => {
    if (!smartToolResult || !smartToolInput.trim()) return;
    try {
      await saveToolDraftMutation.mutateAsync({
        tool: smartToolMode,
        text: smartToolInput.trim(),
        title: smartToolTitle.trim() || undefined,
        result: smartToolResult,
        category: smartToolResult.category,
      });
      setSmartToolError(null);
      alert("تم حفظ الناتج كمسودة معرفة بنجاح.");
    } catch (error: any) {
      setSmartToolError(error?.message || error?.data?.message || "تعذر حفظ الناتج كمسودة معرفة.");
    }
  };

  const copyToolResultToClipboard = async () => {
    const content = getSmartToolResultText();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setSmartToolError(null);
    } catch (error: any) {
      setSmartToolError(error?.message || "تعذر نسخ ناتج الأداة.");
    }
  };

  const exportEvaluationLog = () => {
    if (!evaluationEntries.length) return;
    const payload = JSON.stringify(evaluationEntries, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assistant-evaluations-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const clearEvaluationLog = () => {
    setEvaluationEntries([]);
    setEvaluationNotes("");
    setEvaluationStatus("review");
  };

  const applySmartToolSample = (sample: ToolSample) => {
    setSmartToolTitle(sample.title);
    setSmartToolInput(sample.text);
    setSmartToolResult(null);
    setSmartToolError(null);
  };

  const lastAssistantMessage = [...(conversationData?.messages || [])]
    .reverse()
    .find((item: any) => item.role === "assistant");
  const lastUserMessage = [...(conversationData?.messages || [])]
    .reverse()
    .find((item: any) => item.role === "user");

  const saveLastAssistantResponseAsEvaluation = () => {
    if (!lastAssistantMessage?.content) {
      setSmartToolError("لا يوجد رد مساعد حديث لاعتماده كنتيجة اختبار.");
      return;
    }

    const entry: EvaluationEntry = {
      id: `${Date.now()}`,
      title: activePlaybookTitle || "اختبار يدوي",
      category: conversationData?.conversation?.category || "general",
      prompt: String(lastUserMessage?.content || activePlaybookTitle || "اختبار مباشر"),
      response: String(lastAssistantMessage.content || ""),
      status: evaluationStatus,
      notes: evaluationNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    setEvaluationEntries((prev) => [entry, ...prev]);
    setEvaluationNotes("");
    setEvaluationStatus("review");
    setSmartToolError(null);
  };

  const evaluationSummary = {
    total: evaluationEntries.length,
    pass: evaluationEntries.filter((item) => item.status === "pass").length,
    review: evaluationEntries.filter((item) => item.status === "review").length,
    fail: evaluationEntries.filter((item) => item.status === "fail").length,
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "عام",
      legal: "قانوني",
      jurisprudence: "فقهي",
      administrative: "إداري",
      historical: "تاريخي",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "border-transparent bg-muted text-foreground",
      legal: "border-transparent bg-muted text-foreground",
      jurisprudence: "border-transparent bg-muted text-foreground",
      administrative: "border-transparent bg-muted text-foreground",
      historical: "border-transparent bg-muted text-foreground",
    };
    return colors[category] || colors.general;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-enhanced max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">يجب تسجيل الدخول</h2>
            <p className="text-muted-foreground">الرجاء تسجيل الدخول للوصول إلى المحادثة</p>
            <Button asChild>
              <Link href="/">العودة للرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="admin-page-cleanup assistant-comfort-shell assistant-polish-v54 min-h-screen bg-background text-foreground">
      <div className="assistant-workspace-v54 mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-[1500px] gap-4 px-3 py-4 lg:px-5">
        <aside className={cn(
          "assistant-history-panel-v54 hidden w-[300px] shrink-0 overflow-hidden rounded-[26px] border border-border/60 bg-card/95 shadow-sm lg:flex lg:flex-col",
          !isSidebarVisible && "lg:hidden",
        )}>
          <div className="assistant-side-header-v54 border-b border-border/60 bg-muted/20 p-4 text-foreground">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">المساعد الذكي</p>
                <h1 className="mt-1 text-2xl font-black">المحادثات</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <Button className="mt-5 w-full rounded-2xl" onClick={() => void handleNewConversation()} disabled={createConversationMutation.isPending}>
              {createConversationMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
              محادثة جديدة
            </Button>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في المحادثات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-2xl border-border bg-background pr-10 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="space-y-2">
              {filteredConversations && filteredConversations.length === 0 && searchQuery && (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  لا توجد محادثات مطابقة.
                </div>
              )}
              {filteredConversations?.map((conv) => (
                <div key={conv.id} className={cn("group relative rounded-2xl border p-3 transition", currentConversationId === conv.id ? "border-primary/30 bg-primary/10 shadow-sm" : "border-transparent bg-transparent hover:border-border hover:bg-muted/20") }>
                  <button onClick={() => setCurrentConversationId(conv.id)} className="block w-full text-right pr-0">
                    <div className={cn("line-clamp-2 text-sm font-bold", currentConversationId === conv.id ? "text-primary" : "text-foreground")}>{conv.title || "محادثة جديدة"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleDateString("ar-EG")}</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("هل أنت متأكد من حذف هذه المحادثة؟")) {
                        setDeletingConversationId(conv.id);
                        deleteConversationMutation.mutate({ id: conv.id });
                      }
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    disabled={deletingConversationId === conv.id}
                  >
                    {deletingConversationId === conv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))}
              {!conversations?.length && (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  لا توجد محادثات سابقة. ابدأ محادثة جديدة.
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="assistant-main-panel-v54 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
          <header className="assistant-chat-header-v54 border-b border-border/60 bg-muted/10 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" asChild className="rounded-2xl border-border bg-background">
                  <Link href="/">
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">واجهة عصرية للمساعد</p>
                  <h2 className="text-2xl font-black text-foreground">نموذج الذكاء الصناعي للأوقاف</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-border bg-background px-4 py-2 text-xs">
                  <span className="font-semibold">حالة مزود الذكاء: </span>
                  <span className={cn(providerHealth?.available ? "text-emerald-600" : "text-amber-600", "font-bold")}>{providerHealth?.available ? "متصل" : "غير متصل"}</span>
                  <span className="mr-2 text-muted-foreground">{providerHealth?.model || "غير محدد"}</span>
                </div>
                <Button variant="outline" className="rounded-2xl border-border bg-background text-foreground" onClick={() => setIsSidebarVisible((prev) => !prev)}>
                  <MessageSquare className="ml-2 h-4 w-4" />
                  المحادثات
                </Button>
                {currentConversationId && conversationData?.messages && conversationData.messages.length > 0 && (
                  <Button variant="outline" className="rounded-2xl border-border bg-background text-foreground" onClick={handleExportPDF}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير PDF
                  </Button>
                )}
                <Button variant="outline" className="rounded-2xl border-border bg-background text-foreground" asChild>
                  <Link href="/faqs">
                    <BookOpen className="ml-2 h-4 w-4" />
                    الأسئلة الشائعة
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {currentConversationId ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" ref={scrollRef}>
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
                  {conversationData?.messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[88%] rounded-[26px] px-5 py-4 shadow-sm sm:max-w-[78%]", msg.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-muted/20 text-foreground") }>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                          <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-2xl", msg.role === "user" ? "bg-primary-foreground/15 text-primary-foreground" : "bg-background text-primary border border-border") }>
                            {msg.role === "user" ? <UserCog className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                          </span>
                          <span>{msg.role === "user" ? "أنت" : "المساعد الذكي"}</span>
                        </div>

                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-headings:font-black prose-p:leading-8 prose-li:leading-8 prose-strong:text-inherit prose-a:text-sky-600 prose-pre:rounded-2xl prose-pre:bg-slate-100 prose-pre:text-slate-800 prose-code:text-inherit prose-ul:my-2 prose-ol:my-2 prose-p:text-inherit">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-8">{msg.content}</p>
                        )}

                        {msg.sources && msg.role === "assistant" && (
                          <div className="mt-4 rounded-2xl border border-border bg-background p-3 text-foreground">
                            <ReferencesDisplay references={JSON.parse(msg.sources)} />
                          </div>
                        )}

                        {msg.role === "assistant" && (
                          <div className="mt-4 border-t border-border/80 pt-3">
                            <MessageRating messageId={msg.id} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isSubmitting && <TypingIndicator />}

                  {!conversationData?.messages.length && !isSubmitting && (
                    <div className="rounded-[28px] border border-dashed border-border bg-muted/10 p-6 sm:p-8">
                      <div className="text-center">
                        <h3 className="text-3xl font-black text-foreground">ابدأ محادثتك</h3>
                        <p className="mt-2 text-muted-foreground">اختر من الأسئلة الشائعة أو اكتب سؤالك الخاص.</p>
                      </div>
                      <div className="mt-6">
                        <SuggestedQuestions
                          onQuestionClick={(question) => {
                            void submitMessageContent(question, { includeUploaded: false, category: "general" });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border/70 bg-card/90 px-4 py-4 backdrop-blur-sm sm:px-6">
                <form onSubmit={handleSendMessage} className="mx-auto w-full max-w-5xl">
                  {chatError && (
                    <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      <div className="font-bold">تعذر إكمال الطلب</div>
                      <div className="mt-1 whitespace-pre-wrap">{chatError}</div>
                    </div>
                  )}

                  <div className="mb-3 flex flex-wrap gap-2">
                    {assistantPlaybooks.slice(0, 4).map((playbook) => (
                      <button
                        key={playbook.title}
                        type="button"
                        onClick={() => {
                          setMessage(playbook.prompt);
                        }}
                        className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted/20"
                      >
                        {playbook.title}
                      </button>
                    ))}
                  </div>

                  {uploadedFile && (
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-muted/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        {extractTextMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setUploadedFile(null); setExtractedText(""); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        try {
                          const reader = new FileReader();
                          const fileData = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => {
                              const base64 = (reader.result as string).split(',')[1];
                              resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                          const result = await extractTextMutation.mutateAsync({ fileData, mimeType: file.type });
                          if (result.success && result.text) {
                            setExtractedText(result.text);
                          } else {
                            alert(result.error || "فشل استخراج النص");
                            setUploadedFile(null);
                          }
                        } catch (error) {
                          console.error("File extraction error:", error);
                          alert("حدث خطأ أثناء معالجة الملف");
                          setUploadedFile(null);
                        }
                      }
                    }}
                  />

                  <div className="assistant-composer-v54 rounded-[26px] border border-border bg-muted/20 p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                      <div className="text-xs text-muted-foreground"><span className="font-bold text-foreground">نمط الإجابة:</span> {researchMode === "deep_research" ? "بحث معمق بالمصادر" : "إجابة موثقة"}</div>
                      <Button type="button" variant={researchMode === "deep_research" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setResearchMode((mode) => mode === "answer" ? "deep_research" : "answer")} disabled={isSubmitting}>
                        {researchMode === "deep_research" ? "البحث المعمق مفعّل" : "تفعيل البحث المعمق"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {voiceInput.isSupported && (
                        <Button type="button" variant={voiceInput.isListening ? "default" : "outline"} size="icon" onClick={() => {
                          if (voiceInput.isListening) {
                            voiceInput.stopListening();
                            if (voiceInput.transcript.trim()) setMessage(voiceInput.transcript.trim());
                            voiceInput.resetTranscript();
                          } else {
                            voiceInput.startListening();
                          }
                        }} disabled={isSubmitting} className={cn("h-11 w-11 rounded-2xl", voiceInput.isListening && "animate-pulse bg-rose-600 hover:bg-rose-700")}>
                          {voiceInput.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      )}

                      {textToSpeech.isSupported && (
                        <Button type="button" variant={textToSpeech.isEnabled ? "default" : "outline"} size="icon" onClick={textToSpeech.toggleEnabled} disabled={isSubmitting} className="h-11 w-11 rounded-2xl">
                          {textToSpeech.isEnabled ? <Volume2 className={cn("h-5 w-5", textToSpeech.isSpeaking && "animate-pulse")} /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                      )}

                      <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="h-11 w-11 rounded-2xl">
                        <Paperclip className="h-5 w-5" />
                      </Button>

                      <Input
                        value={voiceInput.isListening ? voiceInput.transcript : message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={voiceInput.isListening ? "جاري الاستماع..." : "اكتب سؤالك هنا..."}
                        className="h-14 flex-1 rounded-2xl border border-border bg-background text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        disabled={isSubmitting || voiceInput.isListening}
                      />

                      <Button type="submit" disabled={!message.trim() || isSubmitting} className="h-14 rounded-2xl px-5">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {conversationData?.conversation && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>التصنيف:</span>
                      <Badge className={getCategoryColor(conversationData.conversation.category)} variant="outline">
                        {getCategoryLabel(conversationData.conversation.category)}
                      </Badge>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="assistant-start-surface-v54 flex flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="assistant-start-grid-v54 mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-12">
                <Card className="assistant-start-card-v54 xl:col-span-7 rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MessageSquare className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-black">ابدأ اختبار النموذج فعليًا</CardTitle>
                        <CardDescription className="mt-1 text-sm leading-7">
                          هذه المساحة مخصصة لاختبار المساعد الذكي فعليًا عبر سيناريوهات جاهزة، أو بدء محادثة جديدة، أو الانتقال إلى المعرفة والبحث.
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleNewConversation("general")} className="rounded-2xl px-6">
                        <Plus className="ml-2 h-4 w-4" />
                        محادثة جديدة
                      </Button>
                      <Button variant="outline" className="rounded-2xl border-border bg-background" asChild>
                        <Link href="/knowledge-base">استعرض المعرفة</Link>
                      </Button>
                      <Button variant="outline" className="rounded-2xl border-border bg-background" asChild>
                        <Link href="/search">البحث المتقدم</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {assistantPlaybooks.map((playbook) => {
                        const Icon = playbook.icon;
                        return (
                          <button
                            key={playbook.title}
                            type="button"
                            onClick={() => void handlePlaybookRun(playbook.prompt, playbook.category, playbook.title)}
                            className="assistant-playbook-card-v54 rounded-[22px] border border-border bg-background p-4 text-right transition hover:border-primary/40 hover:bg-muted/20"
                          >
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-foreground">{playbook.title}</div>
                                <div className="text-xs text-muted-foreground">{getCategoryLabel(playbook.category)}</div>
                              </div>
                            </div>
                            <p className="text-sm leading-7 text-muted-foreground">{playbook.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="assistant-start-card-v54 xl:col-span-5 rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Wand2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black">مختبر الأدوات الذكية</CardTitle>
                        <CardDescription className="mt-1 text-sm leading-7">
                          جرّب التلخيص والاستخراج والتصنيف مباشرة على نصوصك، ثم أرسل الناتج إلى المحادثة أو احفظه كمسودة معرفة.
                        </CardDescription>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(Object.entries(smartToolMeta) as Array<[SmartToolMode, typeof smartToolMeta[SmartToolMode]]>).map(([mode, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setSmartToolMode(mode);
                              setSmartToolResult(null);
                              setSmartToolError(null);
                            }}
                            className={cn(
                              "rounded-2xl border px-3 py-3 text-right transition",
                              smartToolMode === mode
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:border-primary/20"
                            )}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-bold">{meta.label}</span>
                            </div>
                            <p className="text-xs leading-6 text-muted-foreground">{meta.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={smartToolTitle}
                      onChange={(e) => setSmartToolTitle(e.target.value)}
                      placeholder="عنوان اختياري للنص أو الوثيقة"
                      className="h-12 rounded-2xl border-border bg-background"
                    />
                    <Textarea
                      value={smartToolInput}
                      onChange={(e) => setSmartToolInput(e.target.value)}
                      placeholder="الصق هنا نصًا فعليًا لتجربة التلخيص أو الاستخراج أو التصنيف..."
                      className="min-h-[220px] rounded-[24px] border-border bg-background leading-7"
                    />
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-muted-foreground">عينات جاهزة للاختبار السريع</div>
                      <div className="flex flex-wrap gap-2">
                        {smartToolSamples[smartToolMode].map((sample) => (
                          <button
                            key={`${smartToolMode}-${sample.title}`}
                            type="button"
                            onClick={() => applySmartToolSample(sample)}
                            className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/30 hover:bg-primary/5"
                          >
                            {sample.title}
                          </button>
                        ))}
                        {extractedText ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSmartToolInput(extractedText);
                              if (uploadedFile?.name) setSmartToolTitle(uploadedFile.name);
                            }}
                            className="rounded-full border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs font-medium text-foreground transition hover:border-secondary/50"
                          >
                            استخدام النص المستخرج من الملف
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => void runSmartTool()} disabled={!smartToolInput.trim() || summarizeToolMutation.isPending || extractToolMutation.isPending || classifyToolMutation.isPending}>
                        {(summarizeToolMutation.isPending || extractToolMutation.isPending || classifyToolMutation.isPending) ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Wand2 className="ml-2 h-4 w-4" />}
                        تشغيل الأداة
                      </Button>
                      <Button type="button" variant="outline" onClick={useToolResultInChat} disabled={!smartToolResult}>
                        <MessageSquare className="ml-2 h-4 w-4" />
                        استخدام الناتج في المحادثة
                      </Button>
                      <Button type="button" variant="outline" onClick={copyToolResultToClipboard} disabled={!smartToolResult}>
                        <Copy className="ml-2 h-4 w-4" />
                        نسخ الناتج
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void saveToolResultAsKnowledgeDraft()} disabled={!smartToolResult || saveToolDraftMutation.isPending}>
                        {saveToolDraftMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <BookOpen className="ml-2 h-4 w-4" />}
                        حفظ كمسودة معرفة
                      </Button>
                    </div>
                    {smartToolError && (
                      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {smartToolError}
                      </div>
                    )}
                    {smartToolResult && (
                      <div className="rounded-[24px] border border-border bg-muted/20 p-4">
                        <div className="mb-2 text-sm font-bold text-foreground">ناتج الاختبار</div>
                        <pre className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{getSmartToolResultText()}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="assistant-start-card-v54 xl:col-span-7 rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">لوحة التقييم العملي</CardTitle>
                    <CardDescription className="leading-7">
                      بعد تشغيل أحد سيناريوهات الاختبار أو إجراء محادثة يدوية، يمكنك اعتماد آخر رد للمساعد وتسجيل ملاحظاتك محليًا لاختبار النموذج فعليًا.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="text-xs text-muted-foreground">إجمالي الاختبارات</div>
                        <div className="mt-2 text-2xl font-black text-foreground">{evaluationSummary.total}</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="text-xs text-emerald-700">ناجح</div>
                        <div className="mt-2 text-2xl font-black text-emerald-700">{evaluationSummary.pass}</div>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-xs text-amber-700">يحتاج مراجعة</div>
                        <div className="mt-2 text-2xl font-black text-amber-700">{evaluationSummary.review}</div>
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="text-xs text-rose-700">غير مقنع</div>
                        <div className="mt-2 text-2xl font-black text-rose-700">{evaluationSummary.fail}</div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-border bg-background p-4 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">المعيار الحالي: {activePlaybookTitle || 'اختبار يدوي'}</Badge>
                        {lastAssistantMessage?.content ? (
                          <Badge variant="outline">آخر رد متاح للاعتماد</Badge>
                        ) : (
                          <Badge variant="outline">لا يوجد رد بعد</Badge>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(Object.entries(evaluationStatusMeta) as Array<[EvaluationStatus, typeof evaluationStatusMeta[EvaluationStatus]]>).map(([status, meta]) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setEvaluationStatus(status)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-sm font-bold transition",
                              evaluationStatus === status ? meta.className : "border-border bg-background text-foreground hover:border-primary/30"
                            )}
                          >
                            {meta.label}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={evaluationNotes}
                        onChange={(e) => setEvaluationNotes(e.target.value)}
                        placeholder="دوّن هنا ملاحظاتك على جودة الرد أو نقاط القوة والقصور..."
                        className="min-h-[110px] rounded-2xl border-border bg-background leading-7"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={saveLastAssistantResponseAsEvaluation} disabled={!lastAssistantMessage?.content}>
                          اعتماد آخر رد كنتيجة اختبار
                        </Button>
                        <Button type="button" variant="outline" onClick={exportEvaluationLog} disabled={!evaluationEntries.length}>
                          <Download className="ml-2 h-4 w-4" />
                          تصدير سجل التقييم
                        </Button>
                        <Button type="button" variant="outline" onClick={clearEvaluationLog} disabled={!evaluationEntries.length}>
                          <Trash2 className="ml-2 h-4 w-4" />
                          مسح السجل
                        </Button>
                      </div>
                    </div>

                    {evaluationEntries.length ? (
                      <div className="space-y-3">
                        {evaluationEntries.slice(0, 4).map((entry) => (
                          <div key={entry.id} className="rounded-2xl border border-border bg-background p-4">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <div className="text-sm font-bold text-foreground">{entry.title}</div>
                              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", evaluationStatusMeta[entry.status].className)}>
                                {evaluationStatusMeta[entry.status].label}
                              </span>
                              <span className="text-xs text-muted-foreground">{getCategoryLabel(entry.category)}</span>
                            </div>
                            {entry.notes ? <p className="text-sm leading-7 text-muted-foreground">{entry.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="assistant-start-card-v54 xl:col-span-7 rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">أسئلة وموجهات سريعة للاختبار</CardTitle>
                    <CardDescription className="leading-7">
                      استخدم هذه الأسئلة لتقييم جودة الردود، ثم عدّلها أو طوّرها داخل المحادثة الكاملة.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SuggestedQuestions
                      onQuestionClick={(question) => {
                        void submitMessageContent(question, { includeUploaded: false, category: "general" });
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="assistant-start-card-v54 xl:col-span-5 rounded-[26px] border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">التحقق من المسارات</CardTitle>
                    <CardDescription className="leading-7">
                      هذه الروابط تستخدم المسارات الداخلية الفعلية لتجربة التنقل والتأكد من الانتقال الصحيح داخل التطبيق.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <a href={getAppHref('/chat')} className="assistant-route-link-v54 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:border-primary/30">
                      <span className="font-bold text-foreground">المحادثة الكاملة</span>
                      <span className="text-muted-foreground">{getAppHref('/chat')}</span>
                    </a>
                    <a href={getAppHref('/knowledge-base')} className="assistant-route-link-v54 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:border-primary/30">
                      <span className="font-bold text-foreground">المكتبة المعرفية</span>
                      <span className="text-muted-foreground">{getAppHref('/knowledge-base')}</span>
                    </a>
                    <a href={getAppHref('/search')} className="assistant-route-link-v54 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:border-primary/30">
                      <span className="font-bold text-foreground">البحث المتقدم</span>
                      <span className="text-muted-foreground">{getAppHref('/search')}</span>
                    </a>
                    <a href={getAppHref('/faqs')} className="assistant-route-link-v54 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:border-primary/30">
                      <span className="font-bold text-foreground">الأسئلة الشائعة</span>
                      <span className="text-muted-foreground">{getAppHref('/faqs')}</span>
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {showScrollTop && (
        <button onClick={scrollToTop} className="assistant-floating-action-v54 fixed bottom-8 left-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:scale-105" aria-label="العودة للأعلى">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <button onClick={() => setShowShortcutsDialog(true)} className="assistant-floating-action-v54 fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:scale-105" aria-label="عرض اختصارات لوحة المفاتيح" title="اختصارات لوحة المفاتيح (Ctrl+/)">
        <Keyboard className="h-5 w-5" />
      </button>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={() => {
          if (currentConversationId) setDeletingConversationId(currentConversationId);
        }}
        onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
        onSearchConversations={() => {
          const searchInput = document.querySelector('input[placeholder*="بحث"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }}
        onShowShortcuts={() => setShowShortcutsDialog(true)}
      />

      <KeyboardShortcutsDialog isOpen={showShortcutsDialog} onClose={() => setShowShortcutsDialog(false)} />
    </div>
  );
}
