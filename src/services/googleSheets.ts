/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TechnicianReport } from '../types';

export const SHEET_HEADERS = [
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
  'Panjang Dropcore',
  'Sclamp',
  'Clamp Ring',
  'Clamp Hook',
  'SOC',
  'OTP',
  'Prekso',
  'Patchcore',
  'Material / Note'
];

/**
 * Creates a brand new Google Spreadsheet titled "Kenjeran Rekap - Database Laporan"
 * and initializes it with standard column headers.
 */
export async function createDatabaseSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  // 1. Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Kenjeran Rekap - Database Laporan Teknisi',
      },
      sheets: [
        {
          properties: {
            title: 'Laporan',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Gagal membuat Google Spreadsheet baru');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Add Headers to row 1
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Laporan!A1:AH1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SHEET_HEADERS],
      }),
    }
  );

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Appends a technician report row to the specified Google Spreadsheet.
 */
export async function appendReportToSheet(
  spreadsheetId: string,
  report: TechnicianReport,
  accessToken: string
): Promise<void> {
  const rowValues = [
    report.id || '',
    report.createdAt || '',
    report.typeOrder || '',
    report.segmen || '',
    report.layanan || '',
    report.nik1 || '',
    report.namaTeknisi1 || '',
    report.nik2 || '',
    report.namaTeknisi2 || '',
    report.nomrSc || '',
    report.noTelepon || '',
    report.noInternet || '',
    report.snOnt || '',
    report.macOnt || '',
    report.snStb || '',
    report.macStb || '',
    report.stbId || '',
    report.namaOdp || '',
    report.kapasitasOdp || '',
    report.portDropcore || '',
    report.redamanDiOdp || '',
    report.qrcodeDc || '',
    report.koordinatPelanggan || '',
    report.idValins || '',
    report.jenisDropcore || '',
    report.panjangDropcore || '',
    report.sclamp || '',
    report.clampRing || '',
    report.clampHook || '',
    report.soc || '',
    report.otp || '',
    report.prekso || '',
    report.patchcore || '',
    report.materialNote || '',
  ];

  const cleanId = encodeURIComponent(spreadsheetId.trim());
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A:AH:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error?.message || `Status ${res.status}`;
    if (res.status === 403 || message.includes('permission') || message.includes('caller')) {
      throw new Error('Izin Google Sheets ditolak. Token kadaluarsa atau Anda tidak memiliki akses edit ke Spreadsheet ini. Silakan klik "Login Ulang Google" atau "Buat Sheet Baru".');
    }
    if (res.status === 401 || message.includes('auth') || message.includes('token')) {
      throw new Error('Sesi Google Sign-In telah berakhir. Silakan klik "Login Ulang Google".');
    }
    throw new Error(`Gagal menyimpan ke Google Sheets: ${message}`);
  }
}

/**
 * Fetches all reports stored in the Google Spreadsheet.
 */
export async function fetchReportsFromSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<TechnicianReport[]> {
  const cleanId = encodeURIComponent(spreadsheetId.trim());
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A2:AH`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error?.message || `Status ${res.status}`;
    if (res.status === 403 || message.includes('permission') || message.includes('caller')) {
      throw new Error('Akses Google Sheets ditolak (Token kadaluarsa atau spreadsheet tidak diizinkan). Silakan Login Ulang Google.');
    }
    throw new Error(message || 'Gagal mengambil data dari Google Sheets');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, index) => ({
    id: String(row[0] || `SHEET-${index + 1}`),
    createdAt: String(row[1] || ''),
    typeOrder: String(row[2] || 'AO'),
    segmen: String(row[3] || 'INDIHOME'),
    layanan: String(row[4] || '0-1P'),
    nik1: String(row[5] || ''),
    namaTeknisi1: String(row[6] || ''),
    nik2: String(row[7] || ''),
    namaTeknisi2: String(row[8] || ''),
    nomrSc: String(row[9] || ''),
    noTelepon: String(row[10] || '-'),
    noInternet: String(row[11] || ''),
    snOnt: String(row[12] || ''),
    macOnt: String(row[13] || '-'),
    snStb: String(row[14] || '-'),
    macStb: String(row[15] || '-'),
    stbId: String(row[16] || '-'),
    namaOdp: String(row[17] || ''),
    kapasitasOdp: String(row[18] || '8'),
    portDropcore: String(row[19] || '5'),
    redamanDiOdp: String(row[20] || '-16'),
    qrcodeDc: String(row[21] || ''),
    koordinatPelanggan: String(row[22] || ''),
    idValins: String(row[23] || ''),
    jenisDropcore: String(row[24] || 'HUSBEL'),
    panjangDropcore: String(row[25] || '1'),
    sclamp: String(row[26] || '-'),
    clampRing: String(row[27] || '-'),
    clampHook: String(row[28] || '-'),
    soc: String(row[29] || '2'),
    otp: String(row[30] || '-'),
    prekso: String(row[31] || '-'),
    patchcore: String(row[32] || '-'),
    materialNote: String(row[33] || '-'),
  }));
}

/**
 * Validates access to a spreadsheet ID.
 */
export async function checkSpreadsheetAccess(spreadsheetId: string, accessToken: string): Promise<string> {
  const cleanId = encodeURIComponent(spreadsheetId.trim());
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Spreadsheet ID tidak valid atau tidak ditemukan');
  }

  const data = await res.json();
  return data.properties?.title || 'Google Spreadsheet';
}

/**
 * Appends report to Google Sheets using Apps Script Web App URL (NO LOGIN REQUIRED)
 */
export async function appendReportToAppsScript(
  webAppUrl: string,
  report: TechnicianReport
): Promise<void> {
  const rowValues = [
    report.id || '',
    report.createdAt || '',
    report.typeOrder || '',
    report.segmen || '',
    report.layanan || '',
    report.nik1 || '',
    report.namaTeknisi1 || '',
    report.nik2 || '',
    report.namaTeknisi2 || '',
    report.nomrSc || '',
    report.noTelepon || '',
    report.noInternet || '',
    report.snOnt || '',
    report.macOnt || '',
    report.snStb || '',
    report.macStb || '',
    report.stbId || '',
    report.namaOdp || '',
    report.kapasitasOdp || '',
    report.portDropcore || '',
    report.redamanDiOdp || '',
    report.qrcodeDc || '',
    report.koordinatPelanggan || '',
    report.idValins || '',
    report.jenisDropcore || '',
    report.panjangDropcore || '',
    report.sclamp || '',
    report.clampRing || '',
    report.clampHook || '',
    report.soc || '',
    report.otp || '',
    report.prekso || '',
    report.patchcore || '',
    report.materialNote || '',
  ];

  const res = await fetch(webAppUrl.trim(), {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'append',
      report: report,
      values: rowValues,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal mengirim ke Apps Script Web App (Status ${res.status})`);
  }
}

/**
 * Fetches reports from Google Sheets using Apps Script Web App URL (NO LOGIN REQUIRED)
 */
export async function fetchReportsFromAppsScript(
  webAppUrl: string
): Promise<TechnicianReport[]> {
  const cleanUrl = webAppUrl.trim();
  const res = await fetch(`${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=get`, {
    method: 'GET',
    mode: 'cors',
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data dari Google Apps Script Web App (Status ${res.status})`);
  }

  const data = await res.json();
  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.reports)) {
    rawList = data.reports;
  }

  return rawList.map((item: any, idx: number) => {
    if (Array.isArray(item)) {
      return {
        id: String(item[0] || `SHEET-${idx + 1}`),
        createdAt: String(item[1] || ''),
        typeOrder: String(item[2] || 'AO'),
        segmen: String(item[3] || 'INDIHOME'),
        layanan: String(item[4] || '0-1P'),
        nik1: String(item[5] || ''),
        namaTeknisi1: String(item[6] || ''),
        nik2: String(item[7] || ''),
        namaTeknisi2: String(item[8] || ''),
        nomrSc: String(item[9] || ''),
        noTelepon: String(item[10] || '-'),
        noInternet: String(item[11] || ''),
        snOnt: String(item[12] || ''),
        macOnt: String(item[13] || '-'),
        snStb: String(item[14] || '-'),
        macStb: String(item[15] || '-'),
        stbId: String(item[16] || '-'),
        namaOdp: String(item[17] || ''),
        kapasitasOdp: String(item[18] || '8'),
        portDropcore: String(item[19] || '5'),
        redamanDiOdp: String(item[20] || '-16'),
        qrcodeDc: String(item[21] || ''),
        koordinatPelanggan: String(item[22] || ''),
        idValins: String(item[23] || ''),
        jenisDropcore: String(item[24] || 'HUSBEL'),
        panjangDropcore: String(item[25] || '1'),
        sclamp: String(item[26] || '-'),
        clampRing: String(item[27] || '-'),
        clampHook: String(item[28] || '-'),
        soc: String(item[29] || '2'),
        otp: String(item[30] || '-'),
        prekso: String(item[31] || '-'),
        patchcore: String(item[32] || '-'),
        materialNote: String(item[33] || '-'),
      };
    }
    return {
      id: String(item.id || `SHEET-${idx + 1}`),
      createdAt: String(item.createdAt || ''),
      typeOrder: String(item.typeOrder || 'AO'),
      segmen: String(item.segmen || 'INDIHOME'),
      layanan: String(item.layanan || '0-1P'),
      nik1: String(item.nik1 || ''),
      namaTeknisi1: String(item.namaTeknisi1 || ''),
      nik2: String(item.nik2 || ''),
      namaTeknisi2: String(item.namaTeknisi2 || ''),
      nomrSc: String(item.nomrSc || ''),
      noTelepon: String(item.noTelepon || '-'),
      noInternet: String(item.noInternet || ''),
      snOnt: String(item.snOnt || ''),
      macOnt: String(item.macOnt || '-'),
      snStb: String(item.snStb || '-'),
      macStb: String(item.macStb || '-'),
      stbId: String(item.stbId || '-'),
      namaOdp: String(item.namaOdp || ''),
      kapasitasOdp: String(item.kapasitasOdp || '8'),
      portDropcore: String(item.portDropcore || '5'),
      redamanDiOdp: String(item.redamanDiOdp || '-16'),
      qrcodeDc: String(item.qrcodeDc || ''),
      koordinatPelanggan: String(item.koordinatPelanggan || ''),
      idValins: String(item.idValins || ''),
      jenisDropcore: String(item.jenisDropcore || 'HUSBEL'),
      panjangDropcore: String(item.panjangDropcore || '1'),
      sclamp: String(item.sclamp || '-'),
      clampRing: String(item.clampRing || '-'),
      clampHook: String(item.clampHook || '-'),
      soc: String(item.soc || '2'),
      otp: String(item.otp || '-'),
      prekso: String(item.prekso || '-'),
      patchcore: String(item.patchcore || '-'),
      materialNote: String(item.materialNote || '-'),
    };
  }).filter((r: TechnicianReport) => {
    const inet = r.noInternet.toLowerCase().trim();
    const sn = r.snOnt.toLowerCase().trim();
    return inet !== 'no internet' && inet !== 'no. internet' && inet !== 'no_internet' &&
           sn !== 'sn ont' && sn !== 'sn_ont' && sn !== 'sn';
  });
}

export const RECOMMENDED_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow(data.values);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var reports = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[0]) {
        reports.push({
          id: row[0], createdAt: row[1], typeOrder: row[2], segmen: row[3],
          layanan: row[4], nik1: row[5], namaTeknisi1: row[6], nik2: row[7],
          namaTeknisi2: row[8], nomrSc: row[9], noTelepon: row[10], noInternet: row[11],
          snOnt: row[12], macOnt: row[13], snStb: row[14], macStb: row[15],
          stbId: row[16], namaOdp: row[17], kapasitasOdp: row[18], portDropcore: row[19],
          redamanDiOdp: row[20], qrcodeDc: row[21], koordinatPelanggan: row[22], idValins: row[23],
          jenisDropcore: row[24], panjangDropcore: row[25], sclamp: row[26], clampRing: row[27],
          clampHook: row[28], soc: row[29], otp: row[30], prekso: row[31], patchcore: row[32], materialNote: row[33]
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(reports))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

