import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function Billing() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          الفواتير والدفع
        </h1>
        <p className="text-muted-foreground mt-2">
          إدارة الفواتير ومعلومات الدفع
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>الفواتير</CardTitle>
          <CardDescription>عرض وإدارة الفواتير والمدفوعات</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">سيتم إضافة إدارة الفواتير قريباً...</p>
        </CardContent>
      </Card>
    </div>
  );
}
