import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: "default" | "destructive";
}

export default function ErrorMessage({
  title = "حدث خطأ",
  message,
  onRetry,
  variant = "destructive",
}: ErrorMessageProps) {
  return (
    <Alert variant={variant} className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
