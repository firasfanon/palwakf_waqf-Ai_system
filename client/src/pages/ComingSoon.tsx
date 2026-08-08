/**
 * Coming Soon Page
 * 
 * صفحة عامة تُعرض للصفحات غير الجاهزة بدلاً من 404
 */

import { Link } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ 
  title = "قريباً",
  description = "هذه الصفحة قيد التطوير وستكون متاحة قريباً"
}: ComingSoonProps) {
  return (
    <div dir="rtl" className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Clock className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-3">{title}</h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8 text-lg">
            {description}
          </p>

          {/* Back Button */}
          <Link href="/admin/dashboard">
            <Button size="lg" className="gap-2">
              <ArrowRight className="w-5 h-5" />
              العودة إلى لوحة التحكم
            </Button>
          </Link>

          {/* Additional Info */}
          <p className="text-sm text-muted-foreground mt-6">
            نعمل بجد لإطلاق هذه الميزة. شكراً لصبركم!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
