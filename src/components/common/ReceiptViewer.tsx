import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { getReceiptDisplayUrl, isInlineReceipt } from '@/lib/receipts';
import { Button } from '@/components/ui/button';

interface ReceiptViewerProps {
  receiptUrl?: string;
  label?: string;
  className?: string;
}

export function ReceiptViewer({ receiptUrl, label = 'Receipt', className }: ReceiptViewerProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!receiptUrl) {
      setDisplayUrl(null);
      return;
    }
    setLoading(true);
    getReceiptDisplayUrl(receiptUrl).then((url) => {
      if (!cancelled) {
        setDisplayUrl(url);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [receiptUrl]);

  if (!receiptUrl) {
    return (
      <p className="text-sm text-muted-foreground">No receipt attached.</p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading receipt…
      </div>
    );
  }

  if (!displayUrl) {
    return <p className="text-sm text-muted-foreground">Could not load receipt.</p>;
  }

  const isPdf =
    receiptUrl.toLowerCase().includes('.pdf') ||
    displayUrl.toLowerCase().includes('application/pdf') ||
    displayUrl.toLowerCase().includes('.pdf');

  if (isPdf) {
    return (
      <div className={className}>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a href={displayUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4" />
            {label} (PDF)
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={displayUrl}
          alt={label}
          className="max-h-64 w-full rounded-lg border border-border object-contain bg-secondary/30"
        />
      </a>
      {!isInlineReceipt(receiptUrl) && (
        <Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
          <a href={displayUrl} target="_blank" rel="noopener noreferrer">
            Open full size <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
          </a>
        </Button>
      )}
    </div>
  );
}
