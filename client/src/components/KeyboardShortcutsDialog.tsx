import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquarePlus,
  Trash2,
  Search,
  SidebarClose,
  Send,
  FileX,
  Command,
  Keyboard,
  Home,
  BookOpen,
  HelpCircle,
} from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  icon: React.ReactNode;
  category: "عام" | "محادثة" | "تنقل";
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  const shortcuts: Shortcut[] = [
    // محادثة
    {
      keys: ["Ctrl", "Enter"],
      description: "إرسال الرسالة",
      icon: <Send className="w-4 h-4" />,
      category: "محادثة",
    },
    {
      keys: ["Ctrl", "N"],
      description: "محادثة جديدة",
      icon: <MessageSquarePlus className="w-4 h-4" />,
      category: "محادثة",
    },
    {
      keys: ["Ctrl", "D"],
      description: "حذف المحادثة الحالية",
      icon: <Trash2 className="w-4 h-4" />,
      category: "محادثة",
    },
    {
      keys: ["Ctrl", "F"],
      description: "البحث في المحادثات",
      icon: <Search className="w-4 h-4" />,
      category: "محادثة",
    },
    {
      keys: ["Esc"],
      description: "إغلاق الملفات المرفقة",
      icon: <FileX className="w-4 h-4" />,
      category: "محادثة",
    },
    // عام
    {
      keys: ["/"],
      description: "فتح قائمة الأوامر",
      icon: <Command className="w-4 h-4" />,
      category: "عام",
    },
    {
      keys: ["Ctrl", "K"],
      description: "فتح قائمة الأوامر (بديل)",
      icon: <Command className="w-4 h-4" />,
      category: "عام",
    },
    {
      keys: ["Ctrl", "/"],
      description: "عرض الاختصارات",
      icon: <Keyboard className="w-4 h-4" />,
      category: "عام",
    },
    {
      keys: ["Ctrl", "B"],
      description: "إظهار/إخفاء الشريط الجانبي",
      icon: <SidebarClose className="w-4 h-4" />,
      category: "عام",
    },
    // تنقل
    {
      keys: ["Alt", "H"],
      description: "الصفحة الرئيسية",
      icon: <Home className="w-4 h-4" />,
      category: "تنقل",
    },
    {
      keys: ["Alt", "K"],
      description: "قاعدة المعرفة",
      icon: <BookOpen className="w-4 h-4" />,
      category: "تنقل",
    },
    {
      keys: ["Alt", "F"],
      description: "الأسئلة الشائعة",
      icon: <HelpCircle className="w-4 h-4" />,
      category: "تنقل",
    },
  ];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="w-6 h-6 text-emerald-600" />
            اختصارات لوحة المفاتيح
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-emerald-700 mb-3 pb-2 border-b-2 border-emerald-200">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        {shortcut.icon}
                      </div>
                      <span className="text-gray-700 font-medium">
                        {shortcut.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <div key={i} className="flex items-center">
                          <kbd className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded-md text-sm font-mono font-semibold text-gray-700 shadow-sm group-hover:border-emerald-400 group-hover:text-emerald-700 transition-colors">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-gray-400 font-bold">
                              +
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Tips */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Keyboard className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-emerald-900 mb-1">
                نصائح سريعة
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• استخدم <kbd className="px-2 py-0.5 bg-white border rounded text-xs">/</kbd> أو <kbd className="px-2 py-0.5 bg-white border rounded text-xs">Ctrl+K</kbd> لفتح قائمة الأوامر السريعة</li>
                <li>• اضغط <kbd className="px-2 py-0.5 bg-white border rounded text-xs">Esc</kbd> لإغلاق أي نافذة منبثقة</li>
                <li>• استخدم <kbd className="px-2 py-0.5 bg-white border rounded text-xs">↑↓</kbd> للتنقل في قائمة الأوامر</li>
                <li>• جميع الاختصارات تعمل في أي مكان من الصفحة</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
