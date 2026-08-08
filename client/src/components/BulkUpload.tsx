import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  Save,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FileUploadStatus {
  file: File;
  status: "pending" | "uploading" | "extracting" | "success" | "error";
  progress: number;
  extractedText?: string;
  pdfUrl?: string;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    category?: string;
    tags?: string;
  };
}

export default function BulkUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileUploadStatus | null>(null);

  const uploadPdf = trpc.knowledge.uploadPdf.useMutation();
  const createKnowledge = trpc.knowledge.create.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // التحقق من عدد الملفات (حد أقصى 50)
    if (selectedFiles.length > 50) {
      toast.error("الحد الأقصى 50 ملف في المرة الواحدة");
      return;
    }

    // التحقق من أنواع الملفات
    const validFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'txt';
    });

    if (validFiles.length !== selectedFiles.length) {
      toast.warning("بعض الملفات تم تجاهلها (الأنواع المدعومة: PDF, DOCX, TXT)");
    }

    // إضافة الملفات إلى القائمة
    const newFiles: FileUploadStatus[] = validFiles.map(file => ({
      file,
      status: "pending",
      progress: 0,
      metadata: {
        title: file.name.replace(/\.(pdf|docx|txt)$/i, ''),
        category: "reference",
      }
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const processFile = async (fileStatus: FileUploadStatus, index: number) => {
    try {
      // 1. رفع الملف
      updateFileStatus(index, { status: "uploading", progress: 30 });
      
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileStatus.file);
      });

      // 2. استخراج النص
      updateFileStatus(index, { status: "extracting", progress: 60 });
      
      const result = await uploadPdf.mutateAsync({
        fileName: fileStatus.file.name,
        fileData,
        fileType: fileStatus.file.type || 'application/pdf',
      });

      // 3. استخراج metadata تلقائي من النص
      const extractedTitle = extractTitleFromText(result.extractedText);
      const extractedAuthor = extractAuthorFromText(result.extractedText);

      updateFileStatus(index, {
        status: "success",
        progress: 100,
        extractedText: result.extractedText,
        pdfUrl: result.url,
        metadata: {
          ...fileStatus.metadata,
          title: extractedTitle || fileStatus.metadata?.title,
          author: extractedAuthor,
        }
      });

      return true;
    } catch (error: any) {
      updateFileStatus(index, {
        status: "error",
        progress: 0,
        error: error.message || "فشل معالجة الملف"
      });
      return false;
    }
  };

  const updateFileStatus = (index: number, updates: Partial<FileUploadStatus>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    
    // معالجة متوازية: 5 ملفات في نفس الوقت
    const BATCH_SIZE = 5;
    const pendingIndices = files
      .map((f, i) => ({ file: f, index: i }))
      .filter(({ file }) => file.status === "pending")
      .map(({ index }) => index);
    
    for (let i = 0; i < pendingIndices.length; i += BATCH_SIZE) {
      const batch = pendingIndices.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(index => processFile(files[index], index))
      );
    }
    
    setIsProcessing(false);
    toast.success("تمت معالجة جميع الملفات");
  };

  const handleSaveAll = async () => {
    const successFiles = files.filter(f => f.status === "success");
    
    if (successFiles.length === 0) {
      toast.error("لا توجد ملفات جاهزة للحفظ");
      return;
    }

    setIsProcessing(true);
    let savedCount = 0;

    for (const fileStatus of successFiles) {
      try {
        // Skip files with empty content
        if (!fileStatus.extractedText || fileStatus.extractedText.trim().length === 0) {
          toast.error(`تخطي ${fileStatus.file.name}: لم يتم استخراج نص من الملف`);
          continue;
        }

        await createKnowledge.mutateAsync({
          title: fileStatus.metadata?.title || fileStatus.file.name,
          content: fileStatus.extractedText,
          category: (fileStatus.metadata?.category as any) || "reference",
          tags: fileStatus.metadata?.tags,
          pdfUrl: fileStatus.pdfUrl,
          source: fileStatus.metadata?.author,
        });
        savedCount++;
      } catch (error: any) {
        toast.error(`فشل حفظ ${fileStatus.file.name}: ${error.message}`);
      }
    }

    setIsProcessing(false);
    toast.success(`تم حفظ ${savedCount} من ${successFiles.length} ملف`);
    
    if (savedCount > 0) {
      setFiles([]);
      onSuccess?.();
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMetadata = (index: number, field: string, value: string) => {
    setFiles(prev => prev.map((f, i) => 
      i === index 
        ? { ...f, metadata: { ...f.metadata, [field]: value } }
        : f
    ));
  };

  // استخراج العنوان من أول سطر أو أول جملة
  const extractTitleFromText = (text: string): string => {
    if (!text) return "";
    const lines = text.split('\n').filter(l => l.trim());
    return lines[0]?.substring(0, 100) || "";
  };

  // استخراج المؤلف من النص (بحث عن كلمات مثل "المؤلف:" أو "تأليف:")
  const extractAuthorFromText = (text: string): string => {
    if (!text) return "";
    const authorPatterns = [
      /المؤلف[:\s]+([^\n]+)/,
      /تأليف[:\s]+([^\n]+)/,
      /الكاتب[:\s]+([^\n]+)/,
      /بقلم[:\s]+([^\n]+)/,
    ];
    
    for (const pattern of authorPatterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return "";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "error": return <XCircle className="h-5 w-5 text-destructive" />;
      case "uploading":
      case "extracting": return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "في الانتظار";
      case "uploading": return "جاري الرفع...";
      case "extracting": return "جاري استخراج النص...";
      case "success": return "جاهز";
      case "error": return "فشل";
      default: return status;
    }
  };

  return (
    <div className="admin-page-cleanup space-y-6" dir="rtl">
      {/* منطقة رفع الملفات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع ملفات متعددة (حتى 50 ملف)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center cleanup-surface-muted transition-colors hover:border-primary">
              <Input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-file-input"
                disabled={isProcessing}
              />
              <Label
                htmlFor="bulk-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <span className="text-lg font-medium">اضغط لاختيار الملفات</span>
                <span className="text-sm text-muted-foreground">
                  PDF, DOCX, TXT (حد أقصى 50 ملف - معالجة متوازية 5 ملفات)
                </span>
              </Label>
            </div>

            {files.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleProcessAll}
                  disabled={isProcessing || files.every(f => f.status !== "pending")}
                  className="flex-1"
                >
                  <Loader2 className={`ml-2 h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  معالجة جميع الملفات ({files.filter(f => f.status === "pending").length})
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={isProcessing || files.filter(f => f.status === "success").length === 0}
                  variant="default"
                  className="flex-1"
                >
                  <Save className="ml-2 h-4 w-4" />
                  حفظ الكل ({files.filter(f => f.status === "success").length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* قائمة الملفات */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الملفات ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileStatus, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 cleanup-card">
                  {/* معلومات الملف */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(fileStatus.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fileStatus.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(fileStatus.file.size / 1024).toFixed(1)} KB • {getStatusText(fileStatus.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {fileStatus.status === "success" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewFile(fileStatus)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* شريط التقدم */}
                  {(fileStatus.status === "uploading" || fileStatus.status === "extracting") && (
                    <Progress value={fileStatus.progress} className="h-2" />
                  )}

                  {/* رسالة الخطأ */}
                  {fileStatus.status === "error" && (
                    <div className="cleanup-surface-danger rounded p-2 text-sm">
                      {fileStatus.error}
                    </div>
                  )}

                  {/* Metadata */}
                  {fileStatus.status === "success" && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                      <div>
                        <Label className="text-xs">العنوان</Label>
                        <Input
                          value={fileStatus.metadata?.title || ""}
                          onChange={(e) => handleUpdateMetadata(index, "title", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">المؤلف</Label>
                        <Input
                          value={fileStatus.metadata?.author || ""}
                          onChange={(e) => handleUpdateMetadata(index, "author", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">التصنيف</Label>
                        <Select
                          value={fileStatus.metadata?.category || "reference"}
                          onValueChange={(value) => handleUpdateMetadata(index, "category", value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="law">قوانين</SelectItem>
                            <SelectItem value="jurisprudence">فقه</SelectItem>
                            <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                            <SelectItem value="historical">تاريخي</SelectItem>
                            <SelectItem value="administrative">إداري</SelectItem>
                            <SelectItem value="reference">مرجع</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">الوسوم</Label>
                        <Input
                          value={fileStatus.metadata?.tags || ""}
                          onChange={(e) => handleUpdateMetadata(index, "tags", e.target.value)}
                          placeholder="مفصولة بفواصل"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نافذة المعاينة */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة النص المستخرج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الملف</Label>
              <p className="text-sm font-medium">{previewFile?.file.name}</p>
            </div>
            <div>
              <Label>النص المستخرج ({previewFile?.extractedText?.length || 0} حرف)</Label>
              <Textarea
                value={previewFile?.extractedText || ""}
                readOnly
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
