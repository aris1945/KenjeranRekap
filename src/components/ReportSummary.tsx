/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TechnicianReport } from '../types';
import { formatTelegramMessage } from '../utils';
import { Clipboard, Check, Save, RotateCcw, Sparkles, Printer, RefreshCw } from 'lucide-react';

interface ReportSummaryProps {
  report: Omit<TechnicianReport, 'id' | 'createdAt'>;
  onSave: () => void;
  onReset: () => void;
  onLoadMock: () => void;
  onRandomizeDuplicates?: () => void;
  isDuplicateInternet: boolean;
  isDuplicateSn: boolean;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  report,
  onSave,
  onReset,
  onLoadMock,
  onRandomizeDuplicates,
  isDuplicateInternet,
  isDuplicateSn,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const formattedText = formatTelegramMessage(report);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSaveClick = () => {
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Teknisi - Kenjeran Rekap</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #333; }
            h1 { font-family: sans-serif; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 5px; }
          </style>
        </head>
        <body>
          <h1>📄 LAPORAN TEKNISI - KENJERAN REKAP</h1>
          ${formattedText}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-md shadow-slate-100" id="report-summary-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
          <h3 className="font-bold text-sm tracking-wide uppercase text-slate-800 font-sans">Live Preview Chat Bot</h3>
        </div>
        <button
          onClick={onLoadMock}
          id="btn-load-mock"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-100 transition-all cursor-pointer"
          title="Isi form dengan data persis seperti gambar contoh untuk demonstrasi"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Isi Data Contoh</span>
        </button>
      </div>

      {/* Warning Badges for duplicates */}
      {(isDuplicateInternet || isDuplicateSn) && (
        <div className="flex flex-col gap-2 bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-800 font-sans shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold flex items-center gap-1.5 text-rose-800">
              <span>⚠️ PERINGATAN DUPLIKASI SPREADSHEET</span>
            </p>
            {onRandomizeDuplicates && (
              <button
                type="button"
                onClick={onRandomizeDuplicates}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100/80 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                title="Generasi otomatis Nomor Internet & SN ONT baru agar tidak duplikat di Google Sheets"
              >
                <RefreshCw className="w-3 h-3 text-rose-600" />
                <span>Acak No. Baru</span>
              </button>
            )}
          </div>
          {isDuplicateInternet && (
            <p>• NO INTERNET (<span className="underline font-bold text-rose-950">{report.noInternet}</span>) sudah terdaftar di Google Sheets!</p>
          )}
          {isDuplicateSn && (
            <p>• SN ONT (<span className="underline font-bold text-rose-950">{report.snOnt}</span>) sudah terdaftar di Google Sheets!</p>
          )}
          <p className="text-[11px] text-rose-600/90 italic mt-0.5">
            💡 Data duplikat terdeteksi pada database Google Sheets. Silakan ubah atau klik "Acak No. Baru".
          </p>
        </div>
      )}

      {/* Simulated Telegram Chat Bubble */}
      <div className="relative flex flex-col bg-slate-50 rounded-2xl p-4 border border-slate-200 text-slate-800 font-mono text-[13px] leading-relaxed max-h-[500px] overflow-y-auto shadow-inner" id="telegram-bubble-container">
        {/* Telegram Chat Header mock */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 relative z-10">
          <div className="w-7 h-7 rounded-full bg-[#1e88e5] flex items-center justify-center font-bold text-[10px] text-white">
            KR
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-slate-800">KENJERAN REKAP</span>
            <span className="text-[9px] text-slate-400">bot • active</span>
          </div>
        </div>

        {/* Format Output Preview */}
        <pre className="whitespace-pre-wrap select-text selection:bg-indigo-100 selection:text-indigo-900 relative z-10 leading-relaxed font-mono text-slate-800">
          {formattedText}
        </pre>

        {/* Evidence Photos Preview inside Telegram bubble */}
        {report.evidencePhotos && report.evidencePhotos.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block font-sans">
              📸 Lampiran Evidence ({report.evidencePhotos.length} Foto)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {report.evidencePhotos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={photo} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Success Indicator if Sheets saved */}
        {saveSuccess && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800 font-bold text-xs animate-bounce" id="success-sheets-sim">
            <span>💚 Data berhasil disimpan ke Google Sheets!</span>
          </div>
        )}
      </div>

      {/* Button controls */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={handleCopy}
          id="btn-copy-telegram"
          className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Format Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-4 h-4 text-white" />
              <span>Salin Format Telegram</span>
            </>
          )}
        </button>

        <button
          onClick={handleSaveClick}
          id="btn-save-report"
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-all border border-slate-200 shadow-sm cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-indigo-600" />
          <span>Simpan Histori</span>
        </button>

        <button
          onClick={handlePrint}
          id="btn-print-report"
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-all border border-slate-200 shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cetak Laporan</span>
        </button>

        <button
          onClick={onReset}
          id="btn-reset-form"
          className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs font-semibold rounded-lg transition-all border border-transparent hover:border-slate-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kosongkan Seluruh Form</span>
        </button>
      </div>
    </div>
  );
};
