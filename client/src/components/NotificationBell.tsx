import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Get unread count
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get notifications list
  const { data: notifications, refetch } = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: !!user && isOpen }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Delete notification mutation
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteMutation.mutate({ notificationId });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reply":
        return "💬";
      case "comment":
        return "💭";
      case "approval":
        return "✅";
      case "system":
        return "⚙️";
      case "update":
        return "🔔";
      case "announcement":
        return "📢";
      case "maintenance":
        return "🔧";
      case "alert":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reply: "رد",
      comment: "تعليق",
      approval: "موافقة",
      system: "نظام",
      update: "تحديث",
      announcement: "إعلان",
      maintenance: "صيانة",
      alert: "تنبيه",
    };
    return labels[type] || type;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">الإشعارات</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? "bg-accent/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs h-7"
                          >
                            تعليم كمقروء
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-xs h-7 text-destructive hover:text-destructive"
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t text-center">
            <Button variant="link" size="sm" className="text-xs">
              عرض جميع الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
