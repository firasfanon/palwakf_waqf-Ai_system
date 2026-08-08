import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Edit2, Trash2, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface CommentsSectionProps {
  entityType: string;
  entityId: number;
  title?: string;
}

export default function CommentsSection({
  entityType,
  entityId,
  title = "التعليقات",
}: CommentsSectionProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // Get comments
  const { data: comments, refetch } = trpc.comments.getByEntity.useQuery({
    entityType,
    entityId,
  });

  // Add comment mutation
  const addMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetch();
    },
  });

  // Update comment mutation
  const updateMutation = trpc.comments.update.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      refetch();
    },
  });

  // Delete comment mutation
  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Approve comment mutation (admin only)
  const approveMutation = trpc.comments.approve.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addMutation.mutate({
      entityType,
      entityId,
      content: newComment,
    });
  };

  const handleUpdateComment = (commentId: number) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({
      commentId,
      content: editContent,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      deleteMutation.mutate({ commentId });
    }
  };

  const handleApproveComment = (commentId: number) => {
    approveMutation.mutate({ commentId });
  };

  const startEditing = (commentId: number, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {title}
          {comments && comments.length > 0 && (
            <Badge variant="secondary">{comments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {user && (
          <div className="space-y-3">
            <Textarea
              placeholder="أضف تعليقك هنا..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addMutation.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                إرسال التعليق
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {!comments || comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>لا توجد تعليقات بعد</p>
              {!user && <p className="text-sm mt-2">سجل الدخول لإضافة تعليق</p>}
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.comment.id}
                className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(comment.user?.name || "مستخدم")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{comment.user?.name || "مستخدم"}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.comment.createdAt)}
                    </span>
                    {!comment.comment.isApproved && (
                      <Badge variant="outline" className="text-xs">
                        قيد المراجعة
                      </Badge>
                    )}
                  </div>

                  {editingId === comment.comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.comment.id)}
                          disabled={!editContent.trim() || updateMutation.isPending}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          حفظ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {comment.comment.content}
                      </p>

                      {/* Actions */}
                      {user && (
                        <div className="flex items-center gap-2 mt-3">
                          {user.id === comment.comment.userId && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(comment.comment.id, comment.comment.content)}
                                className="h-7 gap-1 text-xs"
                              >
                                <Edit2 className="h-3 w-3" />
                                تعديل
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteComment(comment.comment.id)}
                                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                حذف
                              </Button>
                            </>
                          )}

                          {user.role === "admin" && !comment.comment.isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveComment(comment.comment.id)}
                              className="h-7 gap-1 text-xs"
                            >
                              <Check className="h-3 w-3" />
                              الموافقة
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
