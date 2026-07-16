import { AlertTriangle } from "lucide-react";

export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-2 text-xs text-muted-foreground ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span>
        AI-generated content may be inaccurate or incomplete. Always review before using it professionally.
      </span>
    </div>
  );
}
