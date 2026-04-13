import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-primary-600 ${className}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
