import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Receipt, X } from 'lucide-react';
import { RECEIPT_ACCEPT } from '@/lib/receipts';
import { ReceiptViewer } from '@/components/common/ReceiptViewer';

interface ReceiptUploadFieldProps {
  value?: string;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  onClearStored?: () => void;
  disabled?: boolean;
}

export function ReceiptUploadField({
  value,
  pendingFile,
  onPendingFileChange,
  onClearStored,
  disabled,
}: ReceiptUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    onPendingFileChange(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const hasStored = !!value && !pendingFile;

  return (
    <div className="space-y-2">
      <Label>Receipt (optional)</Label>
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Receipt className="h-4 w-4" />
          {pendingFile || hasStored ? 'Change receipt' : 'Upload receipt'}
        </Button>
        {(pendingFile || hasStored) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            disabled={disabled}
            onClick={() => {
              handleFile(null);
              onClearStored?.();
              if (inputRef.current) inputRef.current.value = '';
            }}
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      {pendingFile && previewUrl && (
        <img
          src={previewUrl}
          alt="Receipt preview"
          className="max-h-32 rounded-lg border border-border object-contain"
        />
      )}
      {hasStored && !pendingFile && <ReceiptViewer receiptUrl={value} />}
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or PDF. Max 5MB.</p>
    </div>
  );
}
