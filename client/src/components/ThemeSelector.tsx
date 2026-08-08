import { predefinedThemes } from "@/lib/themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export function ThemeSelector() {
  const theme = predefinedThemes[0];

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{theme.label}</span>
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3.5 w-3.5" />
            معتمد حاليًا
          </Badge>
        </CardTitle>
        <CardDescription>{theme.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">ألوان الثيم المركزي:</p>
          <div className="flex gap-2">
            <div className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: theme.colors.primaryColor }} />
            <div className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: theme.colors.secondaryColor }} />
            <div className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: theme.colors.accentColor }} />
            <div className="h-12 w-12 rounded-md border border-border" style={{ backgroundColor: theme.colors.backgroundColor }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          تم تجميد التبديل بين الثيمات مؤقتًا حتى إزالة التنسيقات المتناثرة واعتماد نظام سمات موحد من لوحة التحكم.
        </div>
      </CardContent>
    </Card>
  );
}
