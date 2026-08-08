import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Mail, MapPin, Phone, Send, type LucideIcon } from "lucide-react";
import { PageHead } from "@/components/PageHead";

type ContactInfoItem = {
  icon: LucideIcon;
  title: string;
  value: string;
};

const contactInfoItems: ContactInfoItem[] = [
  { icon: Mail, title: "البريد الإلكتروني", value: "info@waqf-ai.ps" },
  { icon: Phone, title: "الهاتف", value: "+970-2-1234567" },
  { icon: MapPin, title: "العنوان", value: "رام الله - فلسطين" },
];

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const sendMessage = trpc.contact.send.useMutation({
    onSuccess: () => {
      alert("تم إرسال الرسالة بنجاح! سنقوم بالرد عليك في أقرب وقت ممكن");
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: (error) => {
      alert("خطأ في إرسال الرسالة: " + error.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage.mutate(formData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="public-page-shell" dir="rtl">
      <PageHead pageName="contact" defaultTitle="اتصل بنا" defaultDescription="تواصل معنا بخصوص الاستفسارات المتعلقة بالأوقاف الإسلامية" />

      <section className="public-page-hero py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="public-page-title-icon mx-auto">
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">اتصل بنا</h1>
            <p className="text-lg text-muted-foreground">
              نحن هنا للإجابة على استفساراتكم ومساعدتكم في كل ما يتعلق بالأوقاف الإسلامية ضمن واجهة
              عامة موحدة وهوية يمكن إدارتها من لوحة التحكم.
            </p>
          </div>
        </div>
      </section>

      <section className="public-page-section">
        <div className="container">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <Card className="public-surface-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  أرسل لنا رسالة
                </CardTitle>
                <CardDescription>املأ النموذج أدناه وسنقوم بالرد عليك في أقرب وقت ممكن.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required minLength={2} placeholder="أدخل اسمك الكامل" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">الموضوع</Label>
                    <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} required minLength={5} placeholder="موضوع الرسالة" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">الرسالة</Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required minLength={10} rows={6} placeholder="اكتب رسالتك هنا..." />
                  </div>

                  <Button type="submit" className="w-full" disabled={sendMessage.isPending}>
                    {sendMessage.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle>معلومات الاتصال</CardTitle>
                  <CardDescription>يمكنك التواصل معنا عبر القنوات التالية.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {contactInfoItems.map((item) => {
                    const EntryIcon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="public-chip-icon mt-1">
                          <EntryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="text-muted-foreground">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="public-surface-card">
                <CardHeader>
                  <CardTitle>ساعات العمل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 p-3">
                    <span className="font-medium">الأحد - الخميس</span>
                    <span className="text-muted-foreground">8:00 ص - 4:00 م</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/50 p-3">
                    <span className="font-medium">الجمعة - السبت</span>
                    <span className="text-muted-foreground">مغلق</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="public-note-card">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  <p>
                    💡 <strong>نصيحة:</strong> للحصول على رد أسرع، يرجى تقديم أكبر قدر ممكن من التفاصيل
                    في رسالتك.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
