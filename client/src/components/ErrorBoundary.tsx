import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Application Error Boundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6" dir="rtl">
          <section className="operational-surface w-full max-w-xl rounded-2xl border p-8 text-center shadow-sm">
            <AlertTriangle size={44} className="mx-auto mb-5 text-destructive" />
            <h2 className="text-xl font-bold text-foreground">تعذر إكمال هذه الصفحة الآن</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              لم تُعرض تفاصيل تقنية حساسة. أعد تحميل الصفحة، ثم حاول مرة أخرى من مسار العمل نفسه.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={cn(
                "mx-auto mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2",
                "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              <RotateCcw size={16} />
              إعادة تحميل الصفحة
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
