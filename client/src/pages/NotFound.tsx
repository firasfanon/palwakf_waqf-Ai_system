import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="public-page-shell flex min-h-screen w-full items-center justify-center px-4" dir="rtl">
      <Card className="public-surface-card w-full max-w-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="public-page-title-icon">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>

          <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
          <h2 className="mb-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            الصفحة التي تحاول الوصول إليها غير متاحة حاليًا أو تم نقلها إلى مسار آخر.
          </p>

          <div id="not-found-button-group" className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => setLocation("/")} className="px-6 py-2.5">
              <Home className="mr-2 h-4 w-4" />
              العودة إلى الرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
