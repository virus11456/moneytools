/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_AFFILIATE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
