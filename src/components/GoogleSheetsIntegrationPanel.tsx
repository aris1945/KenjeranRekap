/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Globe
} from 'lucide-react';
import { 
  fetchReportsFromAppsScript,
  RECOMMENDED_APPS_SCRIPT_CODE
} from '../services/googleSheets';
import { TechnicianReport } from '../types';

interface Props {
  webAppUrl: string;
  onReportsSynced: (reports: TechnicianReport[]) => void;
}

export const GoogleSheetsIntegrationPanel: React.FC<Props> = ({
  webAppUrl,
  onReportsSynced,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCodeGuide, setShowCodeGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTestFetchWebApp = async () => {
    if (!webAppUrl) {
      setErrorMsg('Web App URL belum diatur di VITE_GOOGLE_WEB_APP_URL (.env).');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const reports = await fetchReportsFromAppsScript(webAppUrl);
      onReportsSynced(reports);
      setSuccessMsg(`Koneksi Web App Berhasil! Terambil ${reports.length} data dari Google Sheets.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menghubungi Web App URL. Pastikan pendaftaran Web App diset ke "Anyone" (Siapa saja).');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md shadow-slate-100 flex flex-col gap-4" id="google-sheets-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Database Google Sheets (Environment Static)
              {webAppUrl ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-600" /> Terhubung
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Belum Terhubung
                </span>
              )}
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" /> ENV
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Setiap laporan teknisi otomatis tersimpan langsung ke Google Sheet via Web App URL terkonfigurasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {webAppUrl && (
            <button
              type="button"
              onClick={handleTestFetchWebApp}
              disabled={loading}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Tarik Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCodeGuide(!showCodeGuide)}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCodeGuide ? 'Tutup Panduan' : 'Panduan Pasang Script'}</span>
            {showCodeGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Info Box */}
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 flex flex-col gap-3">
        {webAppUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Web App URL terpasang dari <strong>VITE_GOOGLE_WEB_APP_URL</strong>:
              </span>
            </div>
            <code className="text-[11px] font-mono bg-white px-2.5 py-1 border border-emerald-200 text-emerald-800 rounded-lg max-w-md truncate">
              {webAppUrl}
            </code>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-800 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Web App URL belum disetting. Tambahkan <strong>VITE_GOOGLE_WEB_APP_URL</strong> di file environment (.env).
            </span>
          </div>
        )}

        {/* Collapsible Guide Modal/Box */}
        {showCodeGuide && (
          <div className="mt-2 bg-white border border-emerald-200 rounded-xl p-4 shadow-inner flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                Cara Membuat Web App di Google Sheets:
              </h4>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Berhasil Disalin!' : 'Salin Kode Google Script'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4 font-medium">
              <li>Buka Google Spreadsheet Anda di browser.</li>
              <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.</li>
              <li>Hapus semua kode bawaan, lalu <strong>Tempel (Paste) Kode Script</strong> yang disalin di atas.</li>
              <li>Klik ikon <strong>Simpan (Disk)</strong>.</li>
              <li>Klik <strong>Terapkan (Deploy)</strong> &gt; pilih <strong>Penerapan Baru (New Deployment)</strong>.</li>
              <li>Pilih jenis <strong>Aplikasi Web (Web App)</strong>.</li>
              <li>Pada opsi <strong>Siapa yang memiliki akses (Who has access)</strong>, pilih <strong>Siapa saja (Anyone)</strong>.</li>
              <li>Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Berikan Akses (Grant Access)</strong> &gt; Salin <strong>URL Aplikasi Web</strong>.</li>
              <li>Atur URL tersebut di file <strong>.env</strong> sebagai <strong>VITE_GOOGLE_WEB_APP_URL</strong>!</li>
            </ol>

            <div className="relative mt-1">
              <textarea
                readOnly
                rows={8}
                value={RECOMMENDED_APPS_SCRIPT_CODE}
                className="w-full font-mono text-[11px] p-3 bg-slate-900 text-slate-100 rounded-xl focus:outline-none border border-slate-700 leading-relaxed resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

