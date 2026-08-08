import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAppHref } from "@/const";
import {
  MessageSquarePlus,
  Trash2,
  Search,
  SidebarClose,
  FileText,
  Keyboard,
  Home,
  BookOpen,
  HelpCircle,
  Settings,
  LogOut,
  Send,
} from "lucide-react";

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut: string;
  action: () => void;
  category: "عام" | "محادثة" | "تنقل";
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onDeleteConversation: () => void;
  onToggleSidebar: () => void;
  onSearchConversations: () => void;
  onShowShortcuts: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNewConversation,
  onDeleteConversation,
  onToggleSidebar,
  onSearchConversations,
  onShowShortcuts,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: "new-conversation",
      title: "محادثة جديدة",
      description: "بدء محادثة جديدة",
      icon: <MessageSquarePlus className="w-5 h-5" />,
      shortcut: "Ctrl+N",
      action: () => {
        onNewConversation();
        onClose();
      },
      category: "محادثة",
    },
    {
      id: "delete-conversation",
      title: "حذف المحادثة",
      description: "حذف المحادثة الحالية",
      icon: <Trash2 className="w-5 h-5" />,
      shortcut: "Ctrl+D",
      action: () => {
        onDeleteConversation();
        onClose();
      },
      category: "محادثة",
    },
    {
      id: "search-conversations",
      title: "البحث في المحادثات",
      description: "البحث في المحادثات السابقة",
      icon: <Search className="w-5 h-5" />,
      shortcut: "Ctrl+F",
      action: () => {
        onSearchConversations();
        onClose();
      },
      category: "محادثة",
    },
    {
      id: "toggle-sidebar",
      title: "إظهار/إخفاء الشريط الجانبي",
      description: "تبديل عرض الشريط الجانبي",
      icon: <SidebarClose className="w-5 h-5" />,
      shortcut: "Ctrl+B",
      action: () => {
        onToggleSidebar();
        onClose();
      },
      category: "عام",
    },
    {
      id: "go-home",
      title: "الصفحة الرئيسية",
      description: "العودة إلى الصفحة الرئيسية",
      icon: <Home className="w-5 h-5" />,
      shortcut: "Alt+H",
      action: () => {
        window.location.href = getAppHref("/");
        onClose();
      },
      category: "تنقل",
    },
    {
      id: "go-knowledge",
      title: "قاعدة المعرفة",
      description: "الانتقال إلى قاعدة المعرفة",
      icon: <BookOpen className="w-5 h-5" />,
      shortcut: "Alt+K",
      action: () => {
        window.location.href = getAppHref("/knowledge-base");
        onClose();
      },
      category: "تنقل",
    },
    {
      id: "go-faqs",
      title: "الأسئلة الشائعة",
      description: "الانتقال إلى الأسئلة الشائعة",
      icon: <HelpCircle className="w-5 h-5" />,
      shortcut: "Alt+F",
      action: () => {
        window.location.href = getAppHref("/faqs");
        onClose();
      },
      category: "تنقل",
    },
    {
      id: "show-shortcuts",
      title: "عرض الاختصارات",
      description: "عرض جميع اختصارات لوحة المفاتيح",
      icon: <Keyboard className="w-5 h-5" />,
      shortcut: "Ctrl+/",
      action: () => {
        onShowShortcuts();
        onClose();
      },
      category: "عام",
    },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0" dir="rtl">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="ابحث عن أمر... (اكتب للبحث)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="pr-10 text-base"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد أوامر مطابقة</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {category}
                </div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-r-4 border-emerald-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cmd.icon}
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-medium ${
                              isSelected ? "text-emerald-900" : "text-gray-900"
                            }`}
                          >
                            {cmd.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cmd.description}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-md text-xs font-mono ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {cmd.shortcut}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border rounded">↑↓</kbd>
              للتنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border rounded">Enter</kbd>
              للتنفيذ
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border rounded">Esc</kbd>
              للإغلاق
            </span>
          </div>
          <div className="text-emerald-600 font-medium">
            {filteredCommands.length} أمر متاح
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
