/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TechnicianReport } from '../types';
import { formatTelegramMessage } from '../utils';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  topicId: string;
  enabled: boolean;
}

export function getTelegramConfig(): TelegramConfig {
  const envBotToken = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '').trim();
  const envChatId = (import.meta.env.VITE_TELEGRAM_CHAT_ID || '').trim();
  const envTopicId = (import.meta.env.VITE_TELEGRAM_TOPIC_ID || '').trim();

  const localBotToken = (localStorage.getItem('kenjeran_tg_bot_token') || '').trim();
  const localChatId = (localStorage.getItem('kenjeran_tg_chat_id') || '').trim();
  const localTopicId = (localStorage.getItem('kenjeran_tg_topic_id') || '').trim();

  // Prioritize environment variables (.env), fallback to localStorage
  const botToken = envBotToken || localBotToken;
  const chatId = envChatId || localChatId;
  const topicId = envTopicId || localTopicId;

  // Automatically enabled as long as botToken and chatId are present
  const enabled = Boolean(botToken && chatId);

  return { botToken, chatId, topicId, enabled };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  localStorage.setItem('kenjeran_tg_bot_token', config.botToken);
  localStorage.setItem('kenjeran_tg_chat_id', config.chatId);
  localStorage.setItem('kenjeran_tg_topic_id', config.topicId);
  localStorage.setItem('kenjeran_tg_enabled', String(config.enabled));
}

export async function sendReportToTelegram(
  report: Omit<TechnicianReport, 'id'> & { createdAt?: string },
  customConfig?: TelegramConfig
): Promise<{ success: boolean; error?: string }> {
  const config = customConfig || getTelegramConfig();

  if (!config.botToken || !config.chatId) {
    return { 
      success: false, 
      error: 'VITE_TELEGRAM_BOT_TOKEN atau VITE_TELEGRAM_CHAT_ID belum diisi di `.env`.' 
    };
  }

  const token = config.botToken.trim();
  const chatId = config.chatId.trim();
  const threadId = config.topicId ? config.topicId.trim() : '';

  const messageText = formatTelegramMessage(report);

  const payload: Record<string, any> = {
    chat_id: chatId,
    text: messageText,
  };

  if (threadId !== '') {
    const threadIdNum = parseInt(threadId, 10);
    if (!isNaN(threadIdNum)) {
      payload.message_thread_id = threadIdNum;
    }
  }

  try {
    // 1. Send Main Text Message
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description || 'Gagal mengirim pesan ke Telegram.' };
    }

    // 2. Send Evidence Photos if present
    const photos = report.evidencePhotos || [];
    if (photos.length > 0) {
      const captionText = `📸 Evidence Foto Lapangan (${photos.length} Foto)\nOrder: ${report.typeOrder} | SC: ${report.nomrSc || '-'} | Inet: ${report.noInternet || '-'}`;

      if (photos.length === 1) {
        // Send single photo
        const formData = new FormData();
        formData.append('chat_id', chatId);
        if (threadId !== '' && !isNaN(parseInt(threadId, 10))) {
          formData.append('message_thread_id', threadId);
        }
        formData.append('caption', captionText);
        formData.append('photo', dataURLtoBlob(photos[0]), 'evidence_1.jpg');

        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send media group (up to 10 photos per batch)
        const batchSize = 10;
        for (let i = 0; i < photos.length; i += batchSize) {
          const currentBatch = photos.slice(i, i + batchSize);
          const formData = new FormData();
          formData.append('chat_id', chatId);
          if (threadId !== '' && !isNaN(parseInt(threadId, 10))) {
            formData.append('message_thread_id', threadId);
          }

          const mediaArray = currentBatch.map((_, idx) => ({
            type: 'photo',
            media: `attach://photo_${idx}`,
            caption: idx === 0 ? `${captionText} [Batch ${Math.floor(i / batchSize) + 1}]` : undefined,
          }));

          formData.append('media', JSON.stringify(mediaArray));

          currentBatch.forEach((photoUrl, idx) => {
            formData.append(`photo_${idx}`, dataURLtoBlob(photoUrl), `evidence_${i + idx + 1}.jpg`);
          });

          await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
            method: 'POST',
            body: formData,
          });
        }
      }
    }

    // 3. Send separator message to delimit each report in Telegram
    const separatorPayload: Record<string, any> = {
      chat_id: chatId,
      text: '=========================',
    };

    if (threadId !== '') {
      const threadIdNum = parseInt(threadId, 10);
      if (!isNaN(threadIdNum)) {
        separatorPayload.message_thread_id = threadIdNum;
      }
    }

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(separatorPayload),
      });
    } catch (sepErr) {
      console.warn('Gagal mengirim garis pembatas ke Telegram:', sepErr);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal terhubung ke Telegram API.' };
  }
}

function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}

export async function testTelegramConnection(
  config: TelegramConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.botToken || !config.chatId) {
    return { success: false, error: 'Harap isi Bot Token dan Chat ID Telegram.' };
  }

  const testReport: Omit<TechnicianReport, 'id'> = {
    createdAt: new Date().toLocaleString('id-ID'),
    typeOrder: 'TEST',
    segmen: 'INDIHOME',
    layanan: '1P',
    nik1: '12345',
    namaTeknisi1: 'Teknisi Test',
    nik2: '-',
    namaTeknisi2: '-',
    nomrSc: 'SC-12345678',
    noTelepon: '08123456789',
    noInternet: '152407999999',
    snOnt: 'TESTSN123456',
    macOnt: 'AA:BB:CC:DD:EE:FF',
    snStb: '-',
    macStb: '-',
    stbId: '-',
    namaOdp: 'ODP-KJN-01',
    kapasitasOdp: '8',
    portDropcore: '1',
    redamanDiOdp: '-18.5',
    qrcodeDc: 'DC-TEST',
    koordinatPelanggan: '-7.25, 112.75',
    idValins: 'VALINS-001',
    jenisDropcore: 'HUSBEL',
    panjangDropcore: '150',
    sclamp: '2',
    clampRing: '1',
    clampHook: '1',
    soc: '2',
    otp: '1',
    prekso: '-',
    patchcore: '1',
    materialNote: 'Test pesan otomatis Telegram dari App Rekap'
  };

  return sendReportToTelegram(testReport, { ...config, enabled: true });
}
