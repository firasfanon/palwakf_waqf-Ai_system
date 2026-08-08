import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WatchlistTemplate } from "@/data/watchlistTemplates";

type Props = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  templates?: WatchlistTemplate[];
  onApply?: (template: WatchlistTemplate) => void;
  onSelectTemplate?: (template: WatchlistTemplate) => void;
};

export function WatchlistTemplatesModal({
  open,
  onOpenChange,
  onClose,
  templates = [],
  onApply,
  onSelectTemplate,
}: Props) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };

  const handleApply = (template: WatchlistTemplate) => {
    onApply?.(template);
    onSelectTemplate?.(template);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>قوالب قوائم المراقبة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border p-3 space-y-2">
              <div className="font-semibold">{template.name}</div>
              {template.description ? <div className="text-sm text-muted-foreground">{template.description}</div> : null}
              <Button type="button" variant="outline" onClick={() => handleApply(template)}>استخدام</Button>
            </div>
          ))}
          {templates.length === 0 ? <div className="text-sm text-muted-foreground">لا توجد قوالب متاحة.</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
