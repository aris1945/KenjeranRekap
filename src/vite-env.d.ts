/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_WEB_APP_URL?: string;
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  readonly VITE_TELEGRAM_CHAT_ID?: string;
  readonly VITE_TELEGRAM_TOPIC_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
