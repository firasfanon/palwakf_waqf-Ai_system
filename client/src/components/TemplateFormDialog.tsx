import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const sectionTypes = [
  { value: "hero", label: "قسم رئيسي" },
  { value: "features", label: "المميزات" },
  { value: "stats", label: "إحصائيات" },
  { value: "cta", label: "دعوة للعمل" },
  { value: "testimonials", label: "شهادات" },
  { value: "faq", label: "أسئلة شائعة" },
  { value: "custom", label: "مخصص" },
];

const templateTypes = [
  { value: "landing", label: "صفحة هبوط" },
  { value: "about", label: "من نحن" },
  { value: "services", label: "خدمات" },
  { value: "portfolio", label: "أعمال" },
  { value: "blog", label: "مدونة" },
  { value: "documentation", label: "توثيق" },
  { value: "dashboard", label: "لوحة تحكم" },
  { value: "ecommerce", label: "متجر" },
  { value: "educational", label: "تعليمي" },
  { value: "nonprofit", label: "غير ربحي" },
];

const layouts = [
  { value: "full-width", label: "عرض كامل" },
  { value: "centered", label: "وسط" },
  { value: "two-columns", label: "عمودين" },
  { value: "three-columns", label: "ثلاثة أعمدة" },
  { value: "grid", label: "شبكة" },
  { value: "sidebar", label: "شريط جانبي" },
];

const colorSchemes = [
  { value: "blue", label: "أزرق" },
  { value: "green", label: "أخضر" },
  { value: "purple", label: "بنفسجي" },
  { value: "orange", label: "برتقالي" },
  { value: "red", label: "أحمر" },
  { value: "gray", label: "رمادي" },
];

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  isLoading,
}: TemplateFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    type: "landing",
    sections: [] as string[],
    layout: "centered",
    colorScheme: "blue",
    thumbnail: "",
  });

  const [newSection, setNewSection] = useState("");

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        nameAr: template.nameAr || "",
        description: template.description || "",
        descriptionAr: template.descriptionAr || "",
        type: template.type || "landing",
        sections: JSON.parse(template.sections || "[]"),
        layout: template.layout || "centered",
        colorScheme: template.colorScheme || "blue",
        thumbnail: template.thumbnail || "",
      });
    } else {
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        type: "landing",
        sections: [],
        layout: "centered",
        colorScheme: "blue",
        thumbnail: "",
      });
    }
  }, [template, open]);

  const handleAddSection = () => {
    if (newSection && !formData.sections.includes(newSection)) {
      setFormData({
        ...formData,
        sections: [...formData.sections, newSection],
      });
      setNewSection("");
    }
  };

  const handleRemoveSection = (section: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((s) => s !== section),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sections: JSON.stringify(formData.sections),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "تعديل القالب" : "إضافة قالب جديد"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "قم بتعديل تفاصيل القالب"
              : "أضف قالب محتوى جديد للاستخدام في الموقع"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">الاسم (English)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="nameAr">الاسم (العربية)</Label>
              <Input
                id="nameAr"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">الوصف (English)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="descriptionAr">الوصف (العربية)</Label>
              <Textarea
                id="descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          {/* Type, Layout, Color Scheme */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">نوع القالب</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="layout">التخطيط</Label>
              <Select
                value={formData.layout}
                onValueChange={(value) =>
                  setFormData({ ...formData, layout: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map((layout) => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="colorScheme">نظام الألوان</Label>
              <Select
                value={formData.colorScheme}
                onValueChange={(value) =>
                  setFormData({ ...formData, colorScheme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemes.map((scheme) => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sections */}
          <div>
            <Label>الأقسام</Label>
            <div className="flex gap-2 mt-2">
              <Select value={newSection} onValueChange={setNewSection}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر قسماً" />
                </SelectTrigger>
                <SelectContent>
                  {sectionTypes.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddSection}>
                إضافة
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.sections.map((section) => (
                <Badge key={section} variant="secondary" className="gap-1">
                  {sectionTypes.find((s) => s.value === section)?.label || section}
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(section)}
                    className="hover:bg-destructive/20 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <Label htmlFor="thumbnail">رابط الصورة المصغرة</Label>
            <Input
              id="thumbnail"
              type="url"
              value={formData.thumbnail}
              onChange={(e) =>
                setFormData({ ...formData, thumbnail: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : template ? "حفظ التعديلات" : "إضافة القالب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
