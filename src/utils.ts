/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TechnicianReport } from './types';

// Format date to DD/MM/YYYY HH:mm:ss
export function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
}

// Format the technician report to matches the Telegram bot summary format exactly
export function formatTelegramMessage(report: Omit<TechnicianReport, 'id'> & { createdAt?: string }): string {
  const timeStr = report.createdAt || formatDateTime(new Date());

  return `📄 LAPORAN TEKNISI
📅 ${timeStr}

🔹 TYPE ORDER : ${report.typeOrder || '-'}
🔹 SEGMEN : ${report.segmen || '-'}
🔹 LAYANAN : ${report.layanan || '-'}

👨‍🔧 NIK 1 : ${report.nik1 || '-'}
👨‍🔧 TEKNISI 1 : ${report.namaTeknisi1 || '-'}
👨‍🔧 NIK 2 : ${report.nik2 || '-'}
👨‍🔧 TEKNISI 2 : ${report.namaTeknisi2 || '-'}

📌 NOMR SC : ${report.nomrSc || '-'}
📞 NO TELEPON : ${report.noTelepon || '-'}
🌐 NO INTERNET : ${report.noInternet || '-'}

📦 SN ONT : ${report.snOnt || '-'}
📦 MAC ONT : ${report.macOnt || '-'}
📦 SN STB : ${report.snStb || '-'}
📦 MAC STB : ${report.macStb || '-'}
📦 STB ID : ${report.stbId || '-'}

🏷️ NAMA ODP : ${report.namaOdp || '-'}
🔌 KAPASITAS ODP : ${report.kapasitasOdp || '-'}
🔌 PORT DROPCORE : ${report.portDropcore || '-'}
🔌 REDAMAN DI ODP : ${report.redamanDiOdp || '-'}
🔌 QRCODE DC : ${report.qrcodeDc || '-'}

📍 KOORDINAT PELANGGAN : ${report.koordinatPelanggan || '-'}
🆔 ID VALINS : ${report.idValins || '-'}

🔧 JENIS DROPCORE : ${report.jenisDropcore || '-'}
📏 PANJANG DROPCORE : ${report.panjangDropcore || '-'}
🔧 SCLAMP : ${report.sclamp || '-'}
🔧 CLAMP RING : ${report.clampRing || '-'}
🔧 CLAMP HOOK : ${report.clampHook || '-'}

📦 SOC : ${report.soc || '-'}
📦 OTP : ${report.otp || '-'}
📦 PREKSO : ${report.prekso || '-'}
📦 PATCHCORE : ${report.patchcore || '-'}

📝 MATERIAL / NOTE : ${report.materialNote || '-'}`;
}

// Export the logs history into a clean CSV format for Google Sheets / Excel
export function exportToCSV(reports: TechnicianReport[]): void {
  if (reports.length === 0) return;

  const headers = [
    'ID',
    'Tanggal Input',
    'Type Order',
    'Segmen',
    'Layanan',
    'NIK 1',
    'Nama Teknisi 1',
    'NIK 2',
    'Nama Teknisi 2',
    'Nomor SC',
    'No Telepon',
    'No Internet',
    'SN ONT',
    'MAC ONT',
    'SN STB',
    'MAC STB',
    'STB ID',
    'Nama ODP',
    'Kapasitas ODP',
    'Port Dropcore',
    'Redaman di ODP',
    'QR Code DC',
    'Koordinat Pelanggan',
    'ID Valins',
    'Jenis Dropcore',
    'Panjang Dropcore (m)',
    'Sclamp',
    'Clamp Ring',
    'Clamp Hook',
    'SOC',
    'OTP',
    'Prekso',
    'Patchcore',
    'Material Note'
  ];

  const rows = reports.map(r => [
    r.id,
    r.createdAt,
    r.typeOrder,
    r.segmen,
    r.layanan,
    `="${r.nik1}"`, // Force excel to treat as text to prevent dropping leading zeros
    r.namaTeknisi1,
    r.nik2 === '-' ? '-' : `="${r.nik2}"`,
    r.namaTeknisi2,
    r.nomrSc,
    `="${r.noTelepon}"`,
    `="${r.noInternet}"`,
    r.snOnt,
    r.macOnt,
    r.snStb,
    r.macStb,
    r.stbId,
    r.namaOdp,
    r.kapasitasOdp,
    r.portDropcore,
    r.redamanDiOdp,
    r.qrcodeDc,
    r.koordinatPelanggan,
    `="${r.idValins}"`,
    r.jenisDropcore,
    r.panjangDropcore,
    r.sclamp,
    r.clampRing,
    r.clampHook,
    r.soc,
    r.otp,
    r.prekso,
    r.patchcore,
    r.materialNote
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Teknisi_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Mock report details matching the user's uploaded screenshot exactly
export const MOCK_REPORT_SCREENSHOT = {
  typeOrder: 'AO',
  segmen: 'INDIHOME',
  layanan: '0-1P',
  nik1: '18990339',
  namaTeknisi1: 'Much Aris Setiawan',
  nik2: '18920217',
  namaTeknisi2: 'Afif Rizal',
  nomrSc: 'AOs3260712100627570686990',
  noTelepon: '-',
  noInternet: '152407281732',
  snOnt: '48575443FFCE12B7',
  macOnt: '-',
  snStb: '-',
  macStb: '-',
  stbId: '-',
  namaOdp: 'ODP-MYR-FVL/35',
  kapasitasOdp: '8',
  portDropcore: '5',
  redamanDiOdp: '-16',
  qrcodeDc: 'Twb0W37X0Y0E',
  koordinatPelanggan: '-7.259398,112.766648',
  idValins: '35169808',
  jenisDropcore: 'HUSBEL',
  panjangDropcore: '1',
  sclamp: '-',
  clampRing: '-',
  clampHook: '-',
  soc: '2',
  otp: '-',
  prekso: '-',
  patchcore: '-',
  materialNote: '-',
};

// Normalize values for duplicate checking (strips quotes, =, decimal .0, whitespace, lowercase)
export function normalizeCheckValue(val?: string | number): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  // Remove Excel/Sheets formula wrappers like ="12345" or =12345 or '12345 or "12345"
  str = str.replace(/^=['"]?/, '').replace(/['"]$/, '');
  // If ends with .0, remove decimal .0
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  return str.trim().toLowerCase();
}

// Checks if a value is a valid non-empty, non-placeholder SC/SN/Internet string
export function isValidCheckValue(val?: string | number): boolean {
  const cleaned = normalizeCheckValue(val);
  if (!cleaned) return false;
  const invalidKeywords = [
    '-',
    '--',
    'no internet',
    'no. internet',
    'no_internet',
    'nomor internet',
    'sn ont',
    'sn_ont',
    'sn',
    'serial number',
    'undefined',
    'null',
    '0'
  ];
  return !invalidKeywords.includes(cleaned);
}

// Generates unique test report data guaranteed not to exist in history/sheets
export function generateUniqueMockData(existingReports: TechnicianReport[]) {
  let randomNoInternet = `152407${Math.floor(100000 + Math.random() * 900000)}`;
  let randomSnOnt = `48575443${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const normalizedExistingInternet = new Set(
    existingReports.map(r => normalizeCheckValue(r.noInternet)).filter(Boolean)
  );
  const normalizedExistingSn = new Set(
    existingReports.map(r => normalizeCheckValue(r.snOnt)).filter(Boolean)
  );

  while (normalizedExistingInternet.has(normalizeCheckValue(randomNoInternet))) {
    randomNoInternet = `152407${Math.floor(100000 + Math.random() * 900000)}`;
  }
  while (normalizedExistingSn.has(normalizeCheckValue(randomSnOnt))) {
    randomSnOnt = `48575443${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  return {
    ...MOCK_REPORT_SCREENSHOT,
    noInternet: randomNoInternet,
    snOnt: randomSnOnt,
    nomrSc: `AOs3260${Math.floor(100000 + Math.random() * 900000)}0627570686990`,
  };
}

// Quick option choices for standard fields
export const FORM_OPTIONS = {
  typeOrder: ['AO', 'MO', 'PDA'],
  segmen: ['INDIHOME', 'INDIBIZ', 'MYREP', 'ASIANET FAT', 'ASIANET DW', 'LAINNYA'],
  layanan: ['0-1P', '0-2P [Inet + Voice]', '0-2P [Inet + Useetv/Usee]', '0-3P'],
  jenisDropcore: ['HUSBEL', 'PREKON'],
};
