import React, { useState, useMemo } from 'react';
import { TechnicianReport } from '../types';
import { exportToCSV, formatDateTime } from '../utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Layers,
  Calendar,
  Download,
  Filter,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Activity
} from 'lucide-react';

interface DashboardChartsProps {
  reports: TechnicianReport[];
  onLoadSampleData?: (sampleReports: TechnicianReport[]) => void;
}

const SEGMEN_COLORS: Record<string, string> = {
  INDIHOME: '#4f46e5',     // Indigo
  INDIBIZ: '#0ea5e9',      // Sky
  MYREP: '#10b981',        // Emerald
  'ASIANET FAT': '#f59e0b',// Amber
  'ASIANET DW': '#ec4899', // Pink
  LAINNYA: '#8b5cf6',      // Purple
};

const PALETTE = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// Helper to extract DD/MM/YYYY from various timestamp strings
function extractDateOnly(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  // If DD/MM/YYYY HH:mm:ss format
  if (dateStr.includes('/')) {
    return dateStr.split(' ')[0];
  }
  // If ISO YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr.slice(0, 10);
}

// Generate realistic dummy data for testing charts
export function generateDemoReports(): TechnicianReport[] {
  const segmenList = ['INDIHOME', 'INDIBIZ', 'MYREP', 'ASIANET FAT', 'ASIANET DW', 'LAINNYA'];
  const teknisiList = [
    { nama: 'Budi Santoso', nik: '92001' },
    { nama: 'Ahmad Fauzi', nik: '92002' },
    { nama: 'Rian Hidayat', nik: '92003' },
    { nama: 'Eko Prasetyo', nik: '92004' },
    { nama: 'Dimas Pratama', nik: '92005' },
    { nama: 'Ilham Kurnia', nik: '92006' },
  ];
  const typeOrderList = ['AO', 'MO', 'PDA'];
  const layananList = ['0-1P', '0-2P [Inet + Voice]', '0-2P [Inet + Useetv/Usee]', '0-3P'];

  const now = new Date();
  const demoData: TechnicianReport[] = [];

  for (let i = 0; i < 28; i++) {
    // Generate dates spread across the last 7 days
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(8 + Math.random() * 10), Math.floor(Math.random() * 60));

    const seg = segmenList[Math.floor(Math.random() * segmenList.length)];
    const tek1 = teknisiList[Math.floor(Math.random() * teknisiList.length)];
    const tek2 = teknisiList[Math.floor(Math.random() * teknisiList.length)];
    const to = typeOrderList[Math.floor(Math.random() * typeOrderList.length)];
    const lay = layananList[Math.floor(Math.random() * layananList.length)];

    demoData.push({
      id: `DEMO-${i + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: formatDateTime(date),
      typeOrder: to,
      segmen: seg,
      layanan: lay,
      nik1: tek1.nik,
      namaTeknisi1: tek1.nama,
      nik2: tek2.nik,
      namaTeknisi2: tek2.nama,
      nomrSc: `SC-982${1000 + i}`,
      noTelepon: `031789${100 + i}`,
      noInternet: `152407${10000 + i}`,
      snOnt: `48575443A${100 + i}`,
      macOnt: '00:1A:2B:3C:4D:5E',
      snStb: '-',
      macStb: '-',
      stbId: '-',
      namaOdp: `ODP-KJR-FA/${(i % 12) + 1}`,
      kapasitasOdp: '8',
      portDropcore: `${(i % 8) + 1}`,
      redamanDiOdp: '-18.5',
      qrcodeDc: 'DC-KJR-998',
      koordinatPelanggan: '-7.2575,112.7521',
      idValins: `35169${100 + i}`,
      jenisDropcore: i % 2 === 0 ? 'PREKON' : 'HUSBEL',
      panjangDropcore: `${(i % 3 + 1) * 50}`,
      sclamp: '1',
      clampRing: '1',
      clampHook: '1',
      soc: '2',
      otp: '-',
      prekso: '-',
      patchcore: '1',
      materialNote: 'Pemasangan lancar',
    });
  }

  // Sort descending by date
  return demoData;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  reports,
  onLoadSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'segmen' | 'teknisi' | 'trend'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedSegmenFilter, setSelectedSegmenFilter] = useState<string>('ALL');

  // Filter reports according to selected time range and segment
  const filteredReports = useMemo(() => {
    let result = [...reports];

    const todayStr = formatDateTime(new Date()).split(' ')[0];
    const now = new Date();

    if (timeFilter === 'today') {
      result = result.filter(r => extractDateOnly(r.createdAt) === todayStr);
    } else if (timeFilter === '7days') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(r => {
        const dStr = extractDateOnly(r.createdAt);
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d >= cutoff;
        }
        return true;
      });
    } else if (timeFilter === '30days') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(r => {
        const dStr = extractDateOnly(r.createdAt);
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d >= cutoff;
        }
        return true;
      });
    }

    if (selectedSegmenFilter !== 'ALL') {
      result = result.filter(r => (r.segmen || 'LAINNYA').toUpperCase() === selectedSegmenFilter.toUpperCase());
    }

    return result;
  }, [reports, timeFilter, selectedSegmenFilter]);

  // 1. Aggregation: By Segment
  const segmenChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach(r => {
      const seg = (r.segmen || 'LAINNYA').trim() || 'LAINNYA';
      counts[seg] = (counts[seg] || 0) + 1;
    });

    const total = filteredReports.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        color: SEGMEN_COLORS[name] || '#8b5cf6'
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReports]);

  // 2. Aggregation: By Technician (Teknisi 1 as lead)
  const teknisiChartData = useMemo(() => {
    const counts: Record<string, { count: number; segmenBreakdown: Record<string, number> }> = {};

    filteredReports.forEach(r => {
      const tekName = (r.namaTeknisi1 || 'Tidak Tercatat').trim() || 'Tidak Tercatat';
      if (!counts[tekName]) {
        counts[tekName] = { count: 0, segmenBreakdown: {} };
      }
      counts[tekName].count += 1;
      const seg = (r.segmen || 'LAINNYA').trim();
      counts[tekName].segmenBreakdown[seg] = (counts[tekName].segmenBreakdown[seg] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        breakdown: data.segmenBreakdown
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 technicians
  }, [filteredReports]);

  // 3. Aggregation: Daily Trend (Number of reports per day)
  const dailyTrendData = useMemo(() => {
    const dateMap: Record<string, { date: string; count: number; sortKey: string }> = {};

    filteredReports.forEach(r => {
      const dateStr = extractDateOnly(r.createdAt);
      const parts = dateStr.split('/');
      let sortKey = dateStr;
      if (parts.length === 3) {
        sortKey = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, count: 0, sortKey };
      }
      dateMap[dateStr].count += 1;
    });

    return Object.values(dateMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredReports]);

  // 4. Aggregation: Type Order
  const typeOrderData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach(r => {
      const to = (r.typeOrder || 'LAINNYA').trim() || 'LAINNYA';
      counts[to] = (counts[to] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  // Key KPI Metrics
  const metrics = useMemo(() => {
    const total = filteredReports.length;
    const todayStr = formatDateTime(new Date()).split(' ')[0];
    const todayCount = filteredReports.filter(r => extractDateOnly(r.createdAt) === todayStr).length;

    const topSegmen = segmenChartData[0]?.name || '-';
    const topSegmenCount = segmenChartData[0]?.count || 0;

    const topTeknisi = teknisiChartData[0]?.name || '-';
    const topTeknisiCount = teknisiChartData[0]?.count || 0;

    return {
      total,
      todayCount,
      topSegmen,
      topSegmenCount,
      topTeknisi,
      topTeknisiCount
    };
  }, [filteredReports, segmenChartData, teknisiChartData]);

  // Handle load demo dataset
  const handleLoadDemo = () => {
    if (onLoadSampleData) {
      const sample = generateDemoReports();
      onLoadSampleData(sample);
    }
  };

  const allAvailableSegments = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.segmen) set.add(r.segmen);
    });
    return Array.from(set);
  }, [reports]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn" id="dashboard-analytics-root">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                VISUALISASI & ANALITIK LAPORAN
              </h2>
              <p className="text-xs text-slate-500">
                Ringkasan performa harian berdasarkan segmen pasar dan produktivitas teknisi
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Demo simulation & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {onLoadSampleData && reports.length < 5 && (
            <button
              type="button"
              onClick={handleLoadDemo}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Isi grafik dengan data simulasi teknisi & segmen"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Muat Demo Grafik (28 Data)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportToCSV(filteredReports)}
            disabled={filteredReports.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Reports */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tiket</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tercatat dalam sistem</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-indigo-50/50 rounded-full pointer-events-none" />
        </div>

        {/* Today's Reports */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Laporan Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{metrics.todayCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Diselesaikan hari ini</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-50/50 rounded-full pointer-events-none" />
        </div>

        {/* Top Segment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Segmen Dominan</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 truncate" title={metrics.topSegmen}>
              {metrics.topSegmen}
            </div>
            <p className="text-[11px] text-sky-600 font-bold mt-0.5">
              {metrics.topSegmenCount} laporan ({metrics.total ? Math.round((metrics.topSegmenCount / metrics.total) * 100) : 0}%)
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-sky-50/50 rounded-full pointer-events-none" />
        </div>

        {/* Top Technician */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teknisi Teraktif</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 truncate" title={metrics.topTeknisi}>
              {metrics.topTeknisi}
            </div>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5">
              {metrics.topTeknisiCount} penyelesaian
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-purple-50/50 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Visual View Modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Grafik
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('segmen')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'segmen'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Per Segmen</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teknisi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'teknisi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Per Teknisi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trend'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Harian</span>
          </button>
        </div>

        {/* Filter Controls: Time & Segment */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Rentang:</span>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                timeFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                timeFilter === 'today' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('7days')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                timeFilter === '7days' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 Hari
            </button>
          </div>

          {/* Segment dropdown filter */}
          {allAvailableSegments.length > 0 && (
            <select
              value={selectedSegmenFilter}
              onChange={(e) => setSelectedSegmenFilter(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl border-none outline-none cursor-pointer"
            >
              <option value="ALL">Semua Segmen</option>
              {allAvailableSegments.map(seg => (
                <option key={seg} value={seg}>{seg}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Charts Area */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Data Laporan untuk Ditampilkan</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Simpan laporan teknisi baru melalui formulir input, atau muat data simulasi demo untuk melihat visualisasi grafik secara instan.
          </p>
          {onLoadSampleData && (
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Muat 28 Data Simulasi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* SECTION 1: SEGMEN VISUALIZATION */}
          {(activeTab === 'all' || activeTab === 'segmen') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Segmen Bar Chart */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        Distribusi Laporan per Segmen
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Jumlah instalasi dan aktivasi berdasarkan jenis pasar
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {segmenChartData.length} Segmen
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={segmenChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-800">
                                <p className="font-bold text-slate-200">{data.name}</p>
                                <p className="text-emerald-400 font-extrabold mt-0.5">
                                  {data.count} Laporan ({data.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                      >
                        {segmenChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || PALETTE[index % PALETTE.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Segmen Donut / Proportion Pie Chart */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        Proporsi Pangsa Segmen
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Persentase kontribusi per segmen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-56 sm:h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmenChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {segmenChartData.map((entry, index) => (
                          <Cell
                            key={`donut-${index}`}
                            fill={entry.color || PALETTE[index % PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-800">
                                <p className="font-bold text-slate-200">{data.name}</p>
                                <p className="text-sky-400 font-extrabold mt-0.5">
                                  {data.count} Tiket ({data.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {segmenChartData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-600 truncate text-[11px]">
                        {entry.name}: <strong className="text-slate-900">{entry.count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TEKNISI PERFORMANCE */}
          {(activeTab === 'all' || activeTab === 'teknisi') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      Peringkat Kinerja Laporan per Teknisi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Jumlah laporan selesai berdasarkan nama teknisi pelaksana utama
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  Top {teknisiChartData.length} Teknisi
                </span>
              </div>

              <div className="h-72 sm:h-80 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teknisiChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
                              <p className="font-extrabold text-slate-100">{data.name}</p>
                              <p className="text-purple-400 font-bold mt-1">
                                Total Laporan: {data.count}
                              </p>
                              {data.breakdown && (
                                <div className="mt-2 pt-2 border-t border-slate-800 space-y-0.5 text-[10px] text-slate-300">
                                  {Object.entries(data.breakdown).map(([seg, count]) => (
                                    <div key={seg} className="flex justify-between gap-3">
                                      <span>{seg}:</span>
                                      <span className="font-bold text-white">{count as number}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8b5cf6"
                      radius={[0, 6, 6, 0]}
                    >
                      {teknisiChartData.map((_, index) => (
                        <Cell
                          key={`tek-cell-${index}`}
                          fill={index === 0 ? '#4f46e5' : index === 1 ? '#6366f1' : '#8b5cf6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SECTION 3: DAILY TREND AREA CHART */}
          {(activeTab === 'all' || activeTab === 'trend') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      Tren Akumulasi Laporan Harian
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Volume laporan teknisi yang masuk per tanggal pelaksanaan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-[11px]">Jumlah Laporan / Hari</span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyTrendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stop-color="#10b981" stop-opacity={0.3} />
                        <stop offset="95%" stop-color="#10b981" stop-opacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-800">
                              <p className="font-bold text-slate-300">Tanggal: {data.date}</p>
                              <p className="text-emerald-400 font-extrabold text-sm mt-0.5">
                                {data.count} Laporan Selesai
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SECTION 4: DATA TABLE BREAKDOWN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ringkasan Data Terbaru ({filteredReports.length} Baris)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Terurut dari yang terbaru
              </span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">Segmen</th>
                    <th className="py-2.5 px-4">Teknisi 1</th>
                    <th className="py-2.5 px-4">Type Order</th>
                    <th className="py-2.5 px-4">No. Internet</th>
                    <th className="py-2.5 px-4">ODP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReports.slice(0, 15).map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {row.createdAt || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase"
                          style={{
                            backgroundColor: `${SEGMEN_COLORS[row.segmen] || '#8b5cf6'}18`,
                            color: SEGMEN_COLORS[row.segmen] || '#8b5cf6'
                          }}
                        >
                          {row.segmen || 'LAINNYA'}
                        </span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {row.namaTeknisi1 || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap text-slate-600">
                        {row.typeOrder || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {row.noInternet || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {row.namaOdp || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
