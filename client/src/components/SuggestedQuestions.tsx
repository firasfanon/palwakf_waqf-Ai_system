import { Button } from "@/components/ui/button";
import { MessageCircle, Scale, Building, BookOpen, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const staticSuggestedQuestions = [
  {
    category: "legal",
    icon: Scale,
    color: "",
    questions: [
      "ما هي شروط صحة الوقف في القانون الفلسطيني؟",
      "كيف يتم نقل ملكية الأراضي الموقوفة؟",
      "ما هي الإجراءات القانونية للطعن في وقفية عقار؟",
    ],
  },
  {
    category: "jurisprudence",
    icon: BookOpen,
    color: "",
    questions: [
      "ما هو الفرق بين الوقف الذري والوقف الخيري؟",
      "هل يجوز بيع العقار الموقوف؟",
      "ما حكم استبدال الوقف في الفقه الإسلامي؟",
    ],
  },
  {
    category: "administrative",
    icon: Building,
    color: "",
    questions: [
      "كيف أسجل وقفاً جديداً في وزارة الأوقاف؟",
      "ما هي إجراءات إدارة الأملاك الوقفية؟",
      "كيف أحصل على نسخة من حجة الوقف؟",
    ],
  },
  {
    category: "historical",
    icon: History,
    color: "",
    questions: [
      "ما هي أشهر الأوقاف التاريخية في فلسطين؟",
      "كيف تطور نظام الأوقاف في العهد العثماني؟",
      "ما هو دور الأوقاف في الحفاظ على الهوية الفلسطينية؟",
    ],
  },
];

export function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  const { data: runtimeQuestions } = trpc.suggestedQuestions.list.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  });

  const usingReviewOnlyRuntime = Boolean(
    (runtimeQuestions as any[] | undefined)?.some((row) => row.reviewOnly),
  );

  const suggestedQuestions = useMemo(() => {
    const rows = (runtimeQuestions || []) as any[];
    if (rows.length === 0) return staticSuggestedQuestions;

    const grouped = new Map<string, string[]>();
    for (const row of [...rows].sort(
      (a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
    )) {
      const category = row.category === "fiqh" ? "jurisprudence" : row.category;
      grouped.set(category, [...(grouped.get(category) || []), row.question]);
    }

    return staticSuggestedQuestions
      .map((category) => ({
        ...category,
        questions: grouped.get(category.category) || [],
      }))
      .filter((category) => category.questions.length > 0);
  }, [runtimeQuestions]);

  return (
    <div className="suggested-questions-polish-v54 space-y-5 py-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">ابدأ محادثتك</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          اختر أحد الأسئلة الشائعة أو اكتب سؤالك الخاص
        </p>
        {usingReviewOnlyRuntime && (
          <p className="text-xs text-muted-foreground">
            محتوى Legacy مستعاد للاختبار وقيد المراجعة؛ لا يمثل اعتمادًا نهائيًا.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {suggestedQuestions.map((category) => (
          <div key={category.category} className="space-y-2">
            {category.questions.map((question, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                data-suggested-category={category.category}
                className={cn(
                  "suggested-question-button-v55 w-full justify-start text-right h-auto min-h-14 whitespace-normal py-3.5 px-4 leading-6 border",
                  category.color
                )}
                onClick={() => onQuestionClick(question)}
              >
                <span className="suggested-question-icon-v55" aria-hidden="true">
                  <category.icon className="w-4 h-4" />
                </span>
                <span className="block min-w-0 flex-1 whitespace-normal text-sm font-bold leading-7">{question}</span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
