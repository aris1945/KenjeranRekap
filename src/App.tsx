/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TechnicianReport, INITIAL_REPORT_STATE } from './types';
import { FormInput } from './components/FormInput';
import { ReportSummary } from './components/ReportSummary';
import { appendReportToAppsScript, fetchReportsFromAppsScript } from './services/googleSheets';
import { sendReportToTelegram } from './services/telegramService';
import { EvidenceUploader } from './components/EvidenceUploader';
import { FORM_OPTIONS, MOCK_REPORT_SCREENSHOT, formatDateTime, generateUniqueMockData } from './utils';
import { 
  ClipboardCheck, 
  MapPin, 
  Sparkles, 
  User, 
  Cpu, 
  Database, 
  Layers, 
  Flame, 
  Activity, 
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Send,
  Camera
} from 'lucide-react';

export default function App() {
  const [reportState, setReportState] = useState<Omit<TechnicianReport, 'id' | 'createdAt'>>(INITIAL_REPORT_STATE);
  const [history, setHistory] = useState<TechnicianReport[]>([]);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Google Sheets static Web App URL from environment variable (.env)
  const webAppUrl = import.meta.env.VITE_GOOGLE_WEB_APP_URL || '';
  const [sheetReports, setSheetReports] = useState<TechnicianReport[]>([]);
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<string | null>(null);

  // Auto fetch spreadsheet data when Web App URL is connected
  useEffect(() => {
    if (webAppUrl) {
      fetchReportsFromAppsScript(webAppUrl)
        .then(reports => {
          setSheetReports(reports);
        })
        .catch(err => {
          console.error('Gagal mengambil data dari Apps Script Web App:', err);
        });
    } else {
      setSheetReports([]);
    }
  }, [webAppUrl]);

  // Update current time clock
  useEffect(() => {
    setCurrentTime(formatDateTime(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kenjeran_rekap_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved history:', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  const updateHistory = (newHistory: TechnicianReport[]) => {
    setHistory(newHistory);
    localStorage.setItem('kenjeran_rekap_history', JSON.stringify(newHistory));
  };

  // Helper to validate whether a string value is a real ID/SN to check for duplicates
  const isValidCheckValue = (val?: string) => {
    if (!val) return false;
    const cleaned = String(val).trim().toLowerCase();
    return cleaned !== '' && cleaned !== '-' && cleaned !== 'no internet' && cleaned !== 'no. internet' && cleaned !== 'sn ont' && cleaned !== 'sn';
  };

  // Real-time duplicate checking against Google Sheets database and local history
  const allKnownReports = [...sheetReports, ...history];
  const isDuplicateInternet = Boolean(
    isValidCheckValue(reportState.noInternet) &&
    allKnownReports.some(s => isValidCheckValue(s.noInternet) && String(s.noInternet).trim().toLowerCase() === String(reportState.noInternet).trim().toLowerCase())
  );
  
  const isDuplicateSn = Boolean(
    isValidCheckValue(reportState.snOnt) &&
    allKnownReports.some(s => isValidCheckValue(s.snOnt) && String(s.snOnt).trim().toLowerCase() === String(reportState.snOnt).trim().toLowerCase())
  );

  const handleFieldChange = (field: keyof typeof reportState, value: string | string[]) => {
    setReportState(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Populate sample values matching the exact screenshot or fresh unique data if duplicates exist
  const handleLoadMockData = () => {
    const checkList = sheetReports.length > 0 ? sheetReports : [];
    const isMockInternetDuplicate = checkList.some(h => h.noInternet && String(h.noInternet).trim() === MOCK_REPORT_SCREENSHOT.noInternet.trim());
    const isMockSnDuplicate = checkList.some(h => h.snOnt && String(h.snOnt).trim() === MOCK_REPORT_SCREENSHOT.snOnt.trim());

    if (isMockInternetDuplicate || isMockSnDuplicate) {
      setReportState(generateUniqueMockData(checkList));
    } else {
      setReportState(MOCK_REPORT_SCREENSHOT);
    }
    setErrors({});
    setActiveSection(0);
  };

  // Randomize duplicate values (No Internet, SN ONT, SC) for spreadsheet testing
  const handleRandomizeDuplicates = () => {
    const checkList = sheetReports.length > 0 ? sheetReports : history;
    const freshData = generateUniqueMockData(checkList);
    setReportState(prev => ({
      ...prev,
      noInternet: freshData.noInternet,
      snOnt: freshData.snOnt,
      nomrSc: freshData.nomrSc,
    }));
  };

  // Clean whole form fields
  const handleResetForm = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan formulir?')) {
      setReportState(INITIAL_REPORT_STATE);
      setErrors({});
      setActiveSection(0);
    }
  };

  // Get GPS Location coordinate format: "lat,long"
  const handleGetLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung layanan penentuan lokasi GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        handleFieldChange('koordinatPelanggan', `${lat},${lon}`);
        setGpsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(`Gagal mengambil koordinat: ${error.message}. Masukkan secara manual.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form submission / Saving report to local log and Google Sheets
  const handleSaveReport = async () => {
    // Basic validation
    const newErrors: { [key: string]: string } = {};
    if (!reportState.noInternet) newErrors.noInternet = 'No Internet wajib diisi!';
    if (!reportState.snOnt) newErrors.snOnt = 'SN ONT wajib diisi!';
    if (!reportState.namaTeknisi1) newErrors.namaTeknisi1 = 'Nama Teknisi utama wajib diisi!';
    if (!reportState.nik1) newErrors.nik1 = 'NIK Teknisi wajib diisi!';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-toggle to first section with error
      if (newErrors.nik1 || newErrors.namaTeknisi1) {
        setActiveSection(1); // Section index 1 is Teknisi
      } else if (newErrors.noInternet) {
        setActiveSection(2); // Section index 2 is Pelanggan
      } else if (newErrors.snOnt) {
        setActiveSection(3); // Section index 3 is Perangkat
      }
      return;
    }

    // Fetch latest Google Sheets data if connected to ensure fresh duplicate check
    let currentSheetReports = sheetReports;
    if (webAppUrl) {
      setIsSavingToSheets(true);
      try {
        currentSheetReports = await fetchReportsFromAppsScript(webAppUrl);
        setSheetReports(currentSheetReports);
      } catch (err) {
        console.warn('Gagal memuat data terbaru dari Apps Script Web App saat cek duplikasi:', err);
      }
    }

    // Strict Duplicate Checking before inputting to Google Sheets
    const allExisting = [...currentSheetReports, ...history];
    const targetNoInternet = String(reportState.noInternet || '').trim().toLowerCase();
    const targetSnOnt = String(reportState.snOnt || '').trim().toLowerCase();

    const dupInternet = isValidCheckValue(targetNoInternet) 
      ? allExisting.find(item => isValidCheckValue(item.noInternet) && String(item.noInternet).trim().toLowerCase() === targetNoInternet) 
      : undefined;
    const dupSn = isValidCheckValue(targetSnOnt) 
      ? allExisting.find(item => isValidCheckValue(item.snOnt) && String(item.snOnt).trim().toLowerCase() === targetSnOnt) 
      : undefined;

    if (dupInternet || dupSn) {
      setIsSavingToSheets(false);
      const dupErrors: { [key: string]: string } = {};
      const msgParts: string[] = [];
      
      if (dupInternet) {
        dupErrors.noInternet = `No. Internet "${reportState.noInternet}" sudah terdaftar!`;
        msgParts.push(`No Internet (${reportState.noInternet})`);
      }
      if (dupSn) {
        dupErrors.snOnt = `SN ONT "${reportState.snOnt}" sudah terdaftar!`;
        msgParts.push(`SN ONT (${reportState.snOnt})`);
      }

      setErrors(dupErrors);
      if (dupInternet) setActiveSection(2);
      else if (dupSn) setActiveSection(3);

      setSheetsSyncStatus(`⚠️ SIMPAN DIBATALKAN: ${msgParts.join(' & ')} sudah ada di Google Sheets/Histori! Silakan ubah data atau klik "Acak No. Baru".`);
      return;
    }

    // Create unique ID & timestamp
    const newReport: TechnicianReport = {
      ...reportState,
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      createdAt: formatDateTime(new Date()),
    };

    // Helper to reset customer/device fields while keeping technician identity for fast next entry
    const resetFormForNextReport = () => {
      setReportState({
        ...INITIAL_REPORT_STATE,
        nik1: reportState.nik1,
        namaTeknisi1: reportState.namaTeknisi1,
        nik2: reportState.nik2,
        namaTeknisi2: reportState.namaTeknisi2,
        typeOrder: reportState.typeOrder,
        segmen: reportState.segmen,
      });
      setErrors({});
      setActiveSection(0);
    };

    // 1. Sync to Google Sheets via Web App URL (No Login Required)
    if (webAppUrl) {
      try {
        await appendReportToAppsScript(webAppUrl, newReport);
        setSheetReports(prev => [newReport, ...prev]);
        
        const newHistory = [newReport, ...history];
        updateHistory(newHistory);

        resetFormForNextReport();

        // Auto send to Telegram Topic/Group
        let tgMessage = '';
        const tgRes = await sendReportToTelegram(newReport);
        if (tgRes.success) {
          tgMessage = ' & terkirim ke Telegram!';
        } else if (tgRes.error) {
          tgMessage = ` (⚠️ Telegram: ${tgRes.error})`;
        }

        setSheetsSyncStatus(`✅ Laporan berhasil tersimpan ke Google Sheets${tgMessage}! Form telah disiapkan untuk input berikutnya.`);
        setTimeout(() => setSheetsSyncStatus(null), 5000);
      } catch (err: any) {
        console.error('Error saving to Google Sheets Web App:', err);
        setSheetsSyncStatus(`Gagal kirim ke Google Web App: ${err.message || 'Error'}`);
        setTimeout(() => setSheetsSyncStatus(null), 6000);
      } finally {
        setIsSavingToSheets(false);
      }
    } 
    // 2. Fallback Local Storage Only
    else {
      const newHistory = [newReport, ...history];
      updateHistory(newHistory);

      resetFormForNextReport();

      // Auto send to Telegram Topic/Group
      let tgMessage = '';
      const tgRes = await sendReportToTelegram(newReport);
      if (tgRes.success) {
        tgMessage = ' & terkirim ke Telegram!';
      } else if (tgRes.error) {
        tgMessage = ` (⚠️ Telegram: ${tgRes.error})`;
      }

      setSheetsSyncStatus(`✅ Laporan tersimpan di histori lokal${tgMessage}! Form telah disiapkan untuk input berikutnya.`);
      setTimeout(() => setSheetsSyncStatus(null), 5000);
    }


  };

  const handleDeleteReport = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    updateHistory(updated);
  };

  // Load historical report back to active form
  const handleLoadReportBack = (oldReport: TechnicianReport) => {
    // Strip ID and Date and set state
    const { id, createdAt, ...fields } = oldReport;
    setReportState(fields);
    setErrors({});
    setActiveSection(0); // Return to first section for review
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllHistory = () => {
    updateHistory([]);
  };

  // Defined sections for clean accordion-style editing
  const sections = [
    {
      title: '1. Detail Order & Layanan',
      icon: <Layers className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="typeOrder"
            label="Type Order"
            type="select"
            value={reportState.typeOrder}
            onChange={(val) => handleFieldChange('typeOrder', val)}
            options={FORM_OPTIONS.typeOrder}
            required
            hint="Pilih jenis order pemasangan/aktivasi"
          />
          <FormInput
            id="segmen"
            label="Segmen"
            type="select"
            value={reportState.segmen}
            onChange={(val) => handleFieldChange('segmen', val)}
            options={FORM_OPTIONS.segmen}
            required
            hint="Kategori pasar pelanggan"
          />
          <FormInput
            id="layanan"
            label="Layanan"
            type="select"
            value={reportState.layanan}
            onChange={(val) => handleFieldChange('layanan', val)}
            options={FORM_OPTIONS.layanan}
            required
            hint="Paket layanan yang dipilih"
          />
        </div>
      )
    },
    {
      title: '2. Identitas Teknisi',
      icon: <User className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="nik1"
            label="NIK Teknisi 1"
            value={reportState.nik1}
            onChange={(val) => handleFieldChange('nik1', val)}
            placeholder="Ketik NIK 1, contoh: 18990339"
            required
            error={errors.nik1}
            hint="Nomor Induk Karyawan Teknisi Utama"
          />
          <FormInput
            id="namaTeknisi1"
            label="Nama Teknisi 1"
            value={reportState.namaTeknisi1}
            onChange={(val) => handleFieldChange('namaTeknisi1', val)}
            placeholder="Ketik NAMA TEKNISI 1"
            required
            error={errors.namaTeknisi1}
            hint="Nama Lengkap Teknisi Utama"
          />
          <FormInput
            id="nik2"
            label="NIK Teknisi 2 (Optional)"
            value={reportState.nik2}
            onChange={(val) => handleFieldChange('nik2', val)}
            placeholder="Ketik NIK 2 atau ketik -"
            hint="Gunakan tanda (-) jika tidak ada asisten teknisi"
          />
          <FormInput
            id="namaTeknisi2"
            label="Nama Teknisi 2 (Optional)"
            value={reportState.namaTeknisi2}
            onChange={(val) => handleFieldChange('namaTeknisi2', val)}
            placeholder="Ketik NAMA TEKNISI 2 atau ketik -"
            hint="Gunakan tanda (-) jika tidak ada asisten teknisi"
          />
        </div>
      )
    },
    {
      title: '3. Informasi Pelanggan',
      icon: <Activity className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="nomrSc"
            label="Nomor SC (Service Order)"
            value={reportState.nomrSc}
            onChange={(val) => handleFieldChange('nomrSc', val)}
            placeholder="Ketik NOMR SC, contoh: AOs326071210..."
            hint="Nomor register SC dari sistem"
          />
          <FormInput
            id="noTelepon"
            label="Nomor Telepon Pelanggan"
            value={reportState.noTelepon}
            onChange={(val) => handleFieldChange('noTelepon', val)}
            placeholder="Ketik NO TELEPON"
            hint="Nomor telepon kontak atau tanda (-)"
          />
          <FormInput
            id="noInternet"
            label="Nomor Internet / Speedy"
            value={reportState.noInternet}
            onChange={(val) => handleFieldChange('noInternet', val)}
            placeholder="Ketik NO INTERNET"
            required
            error={errors.noInternet}
            hint="Otomatis tervalidasi jika ada data duplikat"
          />
        </div>
      )
    },
    {
      title: '4. Detail Perangkat (ONT & STB)',
      icon: <Cpu className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="snOnt"
            label="Serial Number (SN) ONT"
            value={reportState.snOnt}
            onChange={(val) => handleFieldChange('snOnt', val)}
            placeholder="Ketik SN ONT, contoh: 48575443FF..."
            required
            error={errors.snOnt}
            hint="Serial Number unit ONT modem"
          />
          <FormInput
            id="macOnt"
            label="MAC Address ONT"
            value={reportState.macOnt}
            onChange={(val) => handleFieldChange('macOnt', val)}
            placeholder="Ketik MAC ONT atau ketik -"
          />
          <FormInput
            id="snStb"
            label="Serial Number (SN) STB"
            value={reportState.snStb}
            onChange={(val) => handleFieldChange('snStb', val)}
            placeholder="Ketik SN STB atau ketik -"
          />
          <FormInput
            id="macStb"
            label="MAC Address STB"
            value={reportState.macStb}
            onChange={(val) => handleFieldChange('macStb', val)}
            placeholder="Ketik MAC STB atau ketik -"
          />
          <FormInput
            id="stbId"
            label="STB ID Pelanggan"
            value={reportState.stbId}
            onChange={(val) => handleFieldChange('stbId', val)}
            placeholder="Ketik STB ID atau ketik -"
          />
        </div>
      )
    },
    {
      title: '5. Data ODP & Pengukuran Redaman',
      icon: <Database className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="namaOdp"
            label="Nama Kotak ODP"
            value={reportState.namaOdp}
            onChange={(val) => handleFieldChange('namaOdp', val)}
            placeholder="Ketik NAMA ODP, contoh: ODP-MYR-FVL/35"
            hint="Kode penamaan ODP pusat distribusi optik"
          />
          <FormInput
            id="kapasitasOdp"
            label="Kapasitas ODP (Port)"
            type="number"
            value={reportState.kapasitasOdp}
            onChange={(val) => handleFieldChange('kapasitasOdp', val)}
            placeholder="Ketik KAPASITAS ODP, contoh: 8"
          />
          <FormInput
            id="portDropcore"
            label="Port Dropcore Dipakai"
            type="number"
            value={reportState.portDropcore}
            onChange={(val) => handleFieldChange('portDropcore', val)}
            placeholder="Ketik PORT DROPCORE, contoh: 5"
          />
          <FormInput
            id="redamanDiOdp"
            label="Redaman Di ODP (dB)"
            value={reportState.redamanDiOdp}
            onChange={(val) => handleFieldChange('redamanDiOdp', val)}
            placeholder="Ketik REDAMAN DI ODP, contoh: -16"
            hint="Gunakan tanda minus (-), satuan desibel"
          />
          <FormInput
            id="qrcodeDc"
            label="QR Code Dropcore"
            value={reportState.qrcodeDc}
            onChange={(val) => handleFieldChange('qrcodeDc', val)}
            placeholder="Ketik QRCODE DC, contoh: Twb0W37X0Y0E"
          />
        </div>
      )
    },
    {
      title: '6. Lokasi & Validasi Sistem',
      icon: <MapPin className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="koordinatPelanggan"
            label="Koordinat Lokasi Pelanggan"
            value={reportState.koordinatPelanggan}
            onChange={(val) => handleFieldChange('koordinatPelanggan', val)}
            placeholder="Ketik atau ambil koordinat lokasi"
            hint="Format: latitude,longitude (misal: -7.259398,112.766648)"
            actionButton={
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-3 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-50 text-indigo-700 hover:text-indigo-800 font-bold text-xs rounded-lg flex items-center gap-1 transition-all border border-indigo-200 cursor-pointer"
                title="Dapatkan koordinat GPS real-time dari browser Anda"
              >
                <MapPin className={`w-4 h-4 ${gpsLoading ? 'animate-bounce text-slate-600' : ''}`} />
                <span>{gpsLoading ? 'Loading...' : 'Ambil GPS'}</span>
              </button>
            }
          />
          <FormInput
            id="idValins"
            label="ID Valins Pelanggan"
            value={reportState.idValins}
            onChange={(val) => handleFieldChange('idValins', val)}
            placeholder="Ketik ID VALINS, contoh: 35169808"
            hint="Kode identifikasi validasi instalasi"
          />
        </div>
      )
    },
    {
      title: '7. Material Dropcore',
      icon: <Flame className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="jenisDropcore"
            label="Jenis Kabel Dropcore"
            type="select"
            value={reportState.jenisDropcore}
            onChange={(val) => handleFieldChange('jenisDropcore', val)}
            options={FORM_OPTIONS.jenisDropcore}
          />
          <FormInput
            id="panjangDropcore"
            label="Panjang Dropcore (Meter)"
            type="number"
            value={reportState.panjangDropcore}
            onChange={(val) => handleFieldChange('panjangDropcore', val)}
            placeholder="Panjang dalam meter"
          />
          <FormInput
            id="sclamp"
            label="Sclamp"
            value={reportState.sclamp}
            onChange={(val) => handleFieldChange('sclamp', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
          <FormInput
            id="clampRing"
            label="Clamp Ring"
            value={reportState.clampRing}
            onChange={(val) => handleFieldChange('clampRing', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
        </div>
      )
    },
    {
      title: '8. Aksesoris Tambahan & Catatan',
      icon: <Info className="w-4 h-4 text-indigo-600" />,
      fields: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <FormInput
            id="clampHook"
            label="Clamp Hook"
            value={reportState.clampHook}
            onChange={(val) => handleFieldChange('clampHook', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
          <FormInput
            id="soc"
            label="Konektor SOC"
            value={reportState.soc}
            onChange={(val) => handleFieldChange('soc', val)}
            placeholder="Jumlah Konektor SOC dipasang"
          />
          <FormInput
            id="otp"
            label="OTP"
            value={reportState.otp}
            onChange={(val) => handleFieldChange('otp', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
          <FormInput
            id="prekso"
            label="Prekso"
            value={reportState.prekso}
            onChange={(val) => handleFieldChange('prekso', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
          <FormInput
            id="patchcore"
            label="Patchcore"
            value={reportState.patchcore}
            onChange={(val) => handleFieldChange('patchcore', val)}
            placeholder="Masukkan jumlah atau tanda -"
          />
          <FormInput
            id="materialNote"
            label="Material Tambahan / Catatan"
            type="textarea"
            value={reportState.materialNote}
            onChange={(val) => handleFieldChange('materialNote', val)}
            placeholder="Catat material tambahan atau catatan khusus lainnya disini..."
          />
        </div>
      )
    },
    {
      title: '9. Foto Evidence Lapangan (Auto Send Telegram)',
      icon: <Camera className="w-4 h-4 text-sky-600" />,
      fields: (
        <EvidenceUploader
          photos={reportState.evidencePhotos || []}
          onChange={(photos) => handleFieldChange('evidencePhotos', photos)}
          maxPhotos={10}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans" id="app-root-layout">
      {/* Premium Elegant Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                KENJERAN REKAP
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                PANEL INPUT LAPORAN TEKNISI • LOKAL AKTIF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">Real-time Clock</span>
              <p className="text-xs font-mono text-slate-600 font-bold">{currentTime}</p>
            </div>
            <button
              onClick={handleLoadMockData}
              id="nav-btn-mock"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Isi Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6" id="dashboard-main">

        {/* Sync status toast notification */}
        {sheetsSyncStatus && (
          <div className={`p-3.5 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn text-xs font-bold ${
            sheetsSyncStatus.includes('Gagal') || sheetsSyncStatus.includes('ditolak') || sheetsSyncStatus.includes('⚠️') || sheetsSyncStatus.includes('Error')
              ? 'bg-rose-900 text-rose-50 border border-rose-800'
              : 'bg-indigo-600 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>{sheetsSyncStatus}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              {isSavingToSheets && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        )}

        {/* Upper Grid Layout: Left Edit Form / Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="upper-layout-grid">
          
          {/* Form Panel (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-4" id="form-editing-panel">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md shadow-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">Formulir Laporan</h2>
                    <p className="text-[10px] text-slate-400">Pilih dan buka bagian di bawah untuk mengisi data</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-500">Progress:</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    {Math.round((Object.values(reportState).filter(v => v && v !== '-').length / 32) * 100)}%
                  </span>
                </div>
              </div>

              {/* Accordion List for Form Sections */}
              <div className="flex flex-col gap-2.5" id="form-accordions">
                {sections.map((section, idx) => {
                  const isOpen = activeSection === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isOpen 
                          ? 'border-indigo-400 bg-indigo-50/10 shadow-sm shadow-indigo-50/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      id={`accordion-section-${idx}`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSection(isOpen ? -1 : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between font-bold text-sm text-left text-slate-700 transition-colors cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          {section.icon}
                          <span className="tracking-wide text-slate-800">{section.title}</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 animate-fadeIn" id={`accordion-content-${idx}`}>
                          {section.fields}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Duplicate alert indicator inside form footer */}
              {(isDuplicateInternet || isDuplicateSn) && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between gap-2.5 text-xs text-rose-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0"></span>
                    <p className="font-sans">
                      ⚠️ Duplikat data ditemukan!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomizeDuplicates}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100/80 text-rose-800 border border-rose-300 rounded-lg font-bold transition-all cursor-pointer text-[11px] flex-shrink-0"
                    title="Hasilkan otomatis Nomor Internet & SN ONT baru agar tidak duplikat"
                  >
                    <RefreshCw className="w-3 h-3 text-rose-600" />
                    <span>Acak No. Baru</span>
                  </button>
                </div>
              )}

              {/* Form Bottom Control Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Reset Form
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadMockData}
                    className="px-4 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Load Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveReport}
                    className="px-5 py-2 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition-all transform active:scale-95 cursor-pointer"
                  >
                    Simpan Laporan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-4" id="live-preview-panel">
            <ReportSummary
              report={reportState}
              onSave={handleSaveReport}
              onReset={handleResetForm}
              onLoadMock={handleLoadMockData}
              onRandomizeDuplicates={handleRandomizeDuplicates}
              isDuplicateInternet={isDuplicateInternet}
              isDuplicateSn={isDuplicateSn}
            />
          </div>

        </div>

      </main>

      {/* Footer information section */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-sans">
        <p>© 2026 Kenjeran Rekap • Form Laporan Lapangan Teknisi</p>
        <p className="text-[10px] mt-1 text-slate-400">Simulasi Google Sheets diaktifkan secara lokal. Data tersimpan secara aman dalam memori lokal browser Anda.</p>
      </footer>
    </div>
  );
}
