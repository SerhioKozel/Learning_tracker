// AdminView — Stage 2 (BL-015)
// Placeholder until Edge Function admin-list-users is implemented.

import { ShieldCheck } from 'lucide-react';

export default function AdminView() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl
                      bg-sky-500/10 border border-sky-500/20">
        <ShieldCheck className="h-5 w-5 text-sky-400" />
      </div>
      <div className="text-center">
        <h1 className="text-base font-semibold text-white">Admin panel</h1>
        <p className="mt-1 text-sm text-ink-500">
          Coming in Stage 2 — BL-015.
        </p>
      </div>
    </div>
  );
}
