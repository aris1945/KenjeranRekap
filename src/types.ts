/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TechnicianReport {
  id: string;
  createdAt: string; // Format: DD/MM/YYYY HH:mm:ss
  typeOrder: 'AO' | 'MO' | 'PDA' | string;
  segmen: 'INDIHOME' | 'INDIBIZ' | 'MYREP' | 'ASIANET FAT' | 'ASIANET DW' | 'LAINNYA' | string;
  layanan: '0-1P' | '0-2P [Inet + Voice]' | '0-2P [Inet + Useetv/Usee]' | '0-3P' | string;
  nik1: string;
  namaTeknisi1: string;
  nik2: string;
  namaTeknisi2: string;
  nomrSc: string;
  noTelepon: string;
  noInternet: string;
  snOnt: string;
  macOnt: string;
  snStb: string;
  macStb: string;
  stbId: string;
  namaOdp: string;
  kapasitasOdp: string;
  portDropcore: string;
  redamanDiOdp: string;
  qrcodeDc: string;
  koordinatPelanggan: string;
  idValins: string;
  jenisDropcore: 'HUSBEL' | 'PREKON' | string;
  panjangDropcore: string;
  sclamp: string;
  clampRing: string;
  clampHook: string;
  soc: string;
  otp: string;
  prekso: string;
  patchcore: string;
  materialNote: string;
  evidencePhotos?: string[];
}

export interface FormError {
  [key: string]: string;
}

export const INITIAL_REPORT_STATE: Omit<TechnicianReport, 'id' | 'createdAt'> = {
  typeOrder: '',
  segmen: '',
  layanan: '',
  nik1: '',
  namaTeknisi1: '',
  nik2: '',
  namaTeknisi2: '',
  nomrSc: '',
  noTelepon: '',
  noInternet: '',
  snOnt: '',
  macOnt: '',
  snStb: '',
  macStb: '',
  stbId: '',
  namaOdp: '',
  kapasitasOdp: '',
  portDropcore: '',
  redamanDiOdp: '',
  qrcodeDc: '',
  koordinatPelanggan: '',
  idValins: '',
  jenisDropcore: '',
  panjangDropcore: '',
  sclamp: '',
  clampRing: '',
  clampHook: '',
  soc: '',
  otp: '',
  prekso: '',
  patchcore: '',
  materialNote: '',
  evidencePhotos: [],
};
