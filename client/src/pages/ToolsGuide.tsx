import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, Brain, FileSearch, Scale, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { APP_ROUTES, getAdminToolRoute } from "@/lib/appRoutes";
import { hasAdminToolsAccess } from "@/lib/access";

export default function ToolsGuide() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading || !user || !hasAdminToolsAccess(user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate(APP_ROUTES.home)}>العودة</Button>
      </div>
    );
  }

  const tools = [
    {
      icon: Brain,
      title: "التنبؤ بنتائج القضايا",
      route: getAdminToolRoute("predict"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "أداة ذكية تستخدم الذكاء الاصطناعي للتنبؤ بنتائج القضايا القانونية بناءً على البيانات التاريخية والسوابق القضائية.",
      features: [
        "تحليل تفاصيل القضية والأطراف المعنية",
        "مقارنة مع السوابق القضائية المشابهة",
        "حساب احتمالية النجاح بناءً على عوامل متعددة",
        "تقديم توصيات قانونية مبنية على البيانات"
      ],
      example: {
        input: "وصف قضية وقفية معقدة تتعلق بأصل مؤجر وشروط الواقف",
        output: "احتمالية النجاح: 75% مع بيان العوامل المؤثرة والمخاطر والتوصيات"
      }
    },
    {
      icon: TrendingUp,
      title: "تحليل السوابق القضائية",
      route: getAdminToolRoute("precedents"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "أداة متخصصة في البحث عن السوابق القضائية المشابهة وتحليل الأنماط القانونية المتكررة.",
      features: [
        "البحث الذكي عن السوابق المشابهة",
        "حساب نسبة الانطباق",
        "اكتشاف الأنماط القانونية المتكررة",
        "تقديم توصيات بناءً على نتائج السوابق"
      ],
      example: {
        input: "وصف نزاع وقفي أو قضية جارية",
        output: "سوابق قريبة + اتجاهات + توصيات قانونية عملية"
      }
    },
    {
      icon: Scale,
      title: "مقارنة الأحكام",
      route: getAdminToolRoute("compare"),
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "أداة لمقارنة حكمين قضائيين أو نصين قانونيين وتحليل أوجه التشابه والاختلاف بينهما.",
      features: [
        "مقارنة تفصيلية بين حكمين",
        "تحديد أوجه التشابه القانونية",
        "تحليل الاختلافات في التطبيق القانوني",
        "تقديم خلاصة وتوصية"
      ],
      example: {
        input: "نص حكم أول + نص حكم ثان أو رقمَي حكمين",
        output: "أوجه تشابه + أوجه اختلاف + خلاصة + توصية"
      }
    },
    {
      icon: FileSearch,
      title: "التلخيص الذكي",
      route: getAdminToolRoute("summarize"),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "أداة ذكية لتلخيص الأحكام والوثائق القانونية الطويلة بشكل مختصر ومفيد.",
      features: [
        "تلخيص تلقائي للنصوص الطويلة",
        "استخراج النقاط الرئيسية",
        "الحفاظ على المعلومات القانونية المهمة",
        "إمكانية حفظ الناتج في مسار المعرفة"
      ],
      example: {
        input: "وثيقة طويلة أو حكم متعدد الصفحات",
        output: "ملخص منظم + نقاط رئيسية + توصيات"
      }
    },
    {
      icon: Sparkles,
      title: "استخراج الكيانات",
      route: getAdminToolRoute("extract"),
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      description: "أداة لاستخراج الكيانات القانونية والمعلومات المهمة من النصوص القضائية أو الإدارية.",
      features: [
        "استخراج الأشخاص والجهات والأماكن",
        "اكتشاف التواريخ والمبالغ والعقارات",
        "استخراج الإحالات والموضوعات القانونية",
        "إمكانية حفظ الناتج كمسودة معرفة"
      ],
      example: {
        input: "نص وثيقة أو حكم أو كتاب رسمي",
        output: "كيانات منظمة + نقاط رئيسية + إحالات مستخرجة"
      }
    },
    {
      icon: Zap,
      title: "التصنيف التلقائي",
      route: getAdminToolRoute("classify"),
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "أداة لتصنيف النصوص والوثائق تلقائيًا وربط الناتج بمسار المعرفة للمراجعة.",
      features: [
        "تحديد الفئة الرئيسية والفرعية",
        "استخراج الكلمات المفتاحية",
        "إظهار درجة الثقة في التصنيف",
        "إمكانية حفظ الناتج كمادة معرفة للمراجعة"
      ],
      example: {
        input: "نص قانوني أو وثيقة إدارية أو وقفية",
        output: "نوع وثيقة + فئة + كلمات مفتاحية + تفسير"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">دليل استخدام الأدوات الذكية</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                شرح شامل لجميع الأدوات المتاحة مع أمثلة عملية
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(getAdminToolRoute("runs"))}>
              سجل التشغيل
            </Button>
            <Button variant="outline" onClick={() => navigate(APP_ROUTES.adminTools)}>
              العودة للأدوات
            </Button>
          </div>
        </div>

        {/* Introduction */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">مرحباً بك في دليل الأدوات الذكية</CardTitle>
            <CardDescription className="text-base">
              هذا الدليل يشرح بالتفصيل كيفية استخدام الأدوات الذكية المتاحة فعليًا في النظام حاليًا.
              كل أداة هنا مرتبطة بمسار موجود وقابل للاختبار مباشرة دون روابط مفقودة أو صفحات غير مفعلة.
              كما أصبحت التشغيلات تُراجع من خلال سجل سيادي مستقل للاعتماد والربط بالمعرفة.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tools Grid */}
        <div className="space-y-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={`${tool.bgColor} border-b`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-white rounded-lg shadow-sm`}>
                        <Icon className={`h-8 w-8 ${tool.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{tool.title}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => navigate(tool.route)} size="sm">
                      جرّب الأداة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Features */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className={`w-1 h-6 ${tool.bgColor} rounded`}></span>
                      المميزات الرئيسية
                    </h3>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {tool.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg">
                          <span className={`${tool.color} mt-1`}>✓</span>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Sparkles className={`h-5 w-5 ${tool.color}`} />
                      مثال عملي
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-background p-3 rounded border-r-4 border-blue-500">
                        <p className="text-xs text-muted-foreground mb-1">المدخل:</p>
                        <p className="text-sm font-medium">{tool.example.input}</p>
                      </div>
                      <div className="bg-background p-3 rounded border-r-4 border-green-500">
                        <p className="text-xs text-muted-foreground mb-1">المخرج المتوقع:</p>
                        <p className="text-sm font-medium">{tool.example.output}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips Section */}
        <Card className="border-yellow-500/30 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-600" />
              نصائح للاستخدام الأمثل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استخدم <strong>التنبؤ بنتائج القضايا</strong> في المراحل الأولى لتقييم فرص النجاح</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استفد من <strong>تحليل السوابق</strong> لبناء حجج قانونية قوية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استخدم <strong>مقارنة الأحكام</strong> لفهم الاختلافات في التطبيق القانوني</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استعن بـ <strong>التلخيص الذكي</strong> لتوفير الوقت في قراءة الأحكام الطويلة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استخدم <strong>استخراج الكيانات</strong> لتنظيم وفهرسة الوثائق القانونية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>جرّب <strong>توليد الوثائق</strong> لإنشاء مسودات أولية للمذكرات القانونية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">→</span>
                <span>استفد من <strong>الإجابة على الأسئلة</strong> للحصول على معلومات سريعة ودقيقة</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-2xl font-bold">هل أنت مستعد للبدء؟</h3>
            <p className="text-muted-foreground text-lg">
              اختر أي أداة من الأدوات أعلاه وابدأ في استكشاف إمكانيات الذكاء الاصطناعي
            </p>
            <Button size="lg" onClick={() => navigate(APP_ROUTES.adminTools)} className="mt-4">
              <Sparkles className="ml-2 h-5 w-5" />
              انتقل إلى الأدوات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
