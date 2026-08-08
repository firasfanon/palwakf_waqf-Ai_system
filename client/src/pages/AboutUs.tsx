import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Users, Award, BookOpen, Scale } from "lucide-react";
import { PageHead } from "@/components/PageHead";


type AudienceCard = {
  title: string;
  description: string;
};

type CoverageCard = {
  title: string;
  items: string[];
};

const audienceCards: AudienceCard[] = [
  { title: "الباحثون والأكاديميون", description: "للحصول على معلومات دقيقة ومراجع موثوقة في مجال الأوقاف الإسلامية." },
  { title: "المحامون والقانونيون", description: "للاستعانة بالقوانين والتشريعات المتعلقة بالأوقاف في القضايا القانونية." },
  { title: "موظفو وزارة الأوقاف", description: "لتسهيل الإجراءات الإدارية والحصول على المعلومات القانونية بسرعة." },
  { title: "المهتمون بالتراث الإسلامي", description: "للتعرف على تاريخ الأوقاف في فلسطين وأهميتها الحضارية والاجتماعية." },
];

const coverageCards: CoverageCard[] = [
  {
    title: "القوانين والتشريعات",
    items: ["قانون الأوقاف الفلسطيني وتعديلاته", "التشريعات العثمانية التاريخية", "القوانين الأردنية السابقة"],
  },
  {
    title: "الأحكام الفقهية",
    items: ["شروط صحة الوقف وأركانه", "أنواع الأوقاف وأحكامها", "أحكام النظارة والإدارة"],
  },
  {
    title: "مجلة الأحكام العدلية",
    items: ["القواعد الفقهية الكلية", "أحكام الوقف في المجلة", "الاجتهادات القضائية ذات الصلة"],
  },
  {
    title: "التاريخ والإدارة",
    items: ["تاريخ الأوقاف في فلسطين", "النماذج الإدارية المعاصرة", "التوثيق والأرشفة الرقمية"],
  },
];
const featureCards = [
  {
    icon: BookOpen,
    title: "قاعدة معرفية شاملة",
    description:
      "نجمع القوانين الفلسطينية، مجلة الأحكام العدلية، التشريعات العثمانية، والمراجع الفقهية في منصة واحدة سهلة الوصول.",
  },
  {
    icon: Scale,
    title: "دقة قانونية وفقهية",
    description:
      "نعتمد على مصادر موثوقة ومراجع معتمدة لضمان دقة المعلومات والاستشارات المقدمة في المسائل القانونية والشرعية.",
  },
  {
    icon: Award,
    title: "تقنية متقدمة",
    description:
      "نستخدم أحدث تقنيات الذكاء الصناعي ومعالجة اللغة الطبيعية لتقديم إجابات دقيقة وسريعة على استفساراتكم.",
  },
];

export default function AboutUs() {
  return (
    <div className="public-page-shell" dir="rtl">
      <PageHead
        pageName="about"
        defaultTitle="عن المشروع - نموذج الذكاء الصناعي للأوقاف"
        defaultDescription="مشروع رائد يجمع بين التكنولوجيا الحديثة والتراث الإسلامي لخدمة قضية الأوقاف في فلسطين"
      />

      <section className="public-page-hero py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <div className="public-page-intro-badge">
              <Scale className="h-4 w-4" />
              <span>عن المشروع</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground leading-relaxed">
              مشروع يجمع بين التكنولوجيا الحديثة والتراث الإسلامي في واجهة موحدة وهوية بصرية مركزية
              قابلة للإدارة من لوحة التحكم.
            </p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <Card className="public-surface-card">
              <CardHeader>
                <div className="public-page-title-icon mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">رسالتنا</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  توفير منصة متكاملة تعتمد على الذكاء الصناعي لتقديم استشارات قانونية وفقهية دقيقة حول
                  الأوقاف الإسلامية في فلسطين بما يساهم في حماية الأوقاف وتنميتها وتوثيقها بشكل علمي ومنهجي.
                </p>
                <p>
                  نسعى لتسهيل الوصول إلى المعلومات القانونية والشرعية المتعلقة بالأوقاف وتقديم أدوات ذكية
                  تساعد الباحثين والمختصين في اتخاذ قرارات مستنيرة.
                </p>
              </CardContent>
            </Card>

            <Card className="public-surface-card">
              <CardHeader>
                <div className="public-page-title-icon mb-4">
                  <Eye className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">رؤيتنا</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  أن نكون المرجع الأول والأشمل في مجال الأوقاف الإسلامية في فلسطين من خلال دمج التقنيات
                  الحديثة مع التراث الفقهي والقانوني الغني.
                </p>
                <p>
                  نطمح لبناء قاعدة معرفية شاملة تخدم الأجيال القادمة وتحافظ على الإرث الوقفي الفلسطيني من
                  خلال التوثيق الرقمي والأرشفة الذكية.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="public-page-section public-page-section--muted">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">ما يميز مشروعنا</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                نجمع بين الأصالة والحداثة لتقديم خدمة متسقة بصريًا ووظيفيًا في مجال الأوقاف.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="public-link-card text-right">
                    <CardHeader>
                      <div className="public-page-title-icon mb-4">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Card className="public-surface-card">
              <CardHeader>
                <div className="public-page-title-icon mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">من نخدم</CardTitle>
                <CardDescription>المشروع مصمم لخدمة فئات متنوعة من المهتمين بالأوقاف.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {audienceCards.map((item) => (
                    <div key={item.title} className="space-y-2 rounded-2xl border border-border/70 bg-card/50 p-4">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="public-page-section public-page-section--muted">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-foreground">التغطية الشاملة</h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              يغطي النموذج جميع جوانب الأوقاف الإسلامية في فلسطين من النواحي القانونية والفقهية
              والتاريخية والإدارية.
            </p>
            <div className="grid gap-6 text-right md:grid-cols-2">
              {coverageCards.map((item) => (
                <Card key={item.title} className="public-surface-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {item.items.map((entry) => (
                      <p key={entry}>• {entry}</p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
