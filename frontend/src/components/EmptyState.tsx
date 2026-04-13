import { FileSearch } from 'lucide-react';

interface Props {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4">
        <FileSearch className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
