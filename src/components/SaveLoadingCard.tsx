import React from 'react';
import { Loader2, CheckCircle2, Database, Send, ShieldCheck, FileCheck } from 'lucide-react';

export type SaveStep = 'validating' | 'sheets' | 'telegram' | 'success';

interface SaveLoadingCardProps {
  isOpen: boolean;
  step: SaveStep;
  message: string;
}

export const SaveLoadingCard: React.FC<SaveLoadingCardProps> = ({ isOpen, step, message }) => {
  if (!isOpen) return null;

  const stepsList = [
    { key: 'validating', label: 'Cek Duplikasi Data', icon: ShieldCheck },
    { key: 'sheets', label: 'Simpan ke Google Sheets', icon: Database },
    { key: 'telegram', label: 'Kirim ke Telegram', icon: Send },
    { key: 'success', label: 'Selesai Simpan', icon: FileCheck },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['validating', 'sheets', 'telegram', 'success'];
    const currentIndex = order.indexOf(step);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return step === 'success' ? 'completed' : 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
        {/* Accent Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 animate-pulse" />

        {/* Animated Icon Header */}
        <div className="relative my-4">
          {step === 'success' ? (
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                {step === 'validating' && <ShieldCheck className="w-7 h-7 animate-pulse" />}
                {step === 'sheets' && <Database className="w-7 h-7 animate-pulse text-indigo-600" />}
                {step === 'telegram' && <Send className="w-7 h-7 animate-bounce text-sky-600" />}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
          {step === 'success' ? 'Laporan Berhasil Disimpan!' : 'Menyimpan Laporan...'}
        </h3>

        {/* Message */}
        <p className="text-xs text-slate-500 mt-1 min-h-[36px] flex items-center justify-center font-medium max-w-xs">
          {message || 'Mohon tunggu sejenak, data sedang diproses...'}
        </p>

        {/* Steps Progress List */}
        <div className="w-full mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-left">
          {stepsList.map((item) => {
            const status = getStepStatus(item.key);
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                  status === 'completed'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : status === 'active'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : status === 'active'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-200/60 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center">
                  {status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {status === 'active' && (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  )}
                  {status === 'pending' && (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom indicator */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
          <span>Kenjeran Rekap Automatic Sync</span>
        </div>
      </div>
    </div>
  );
};
