/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_OWNER_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
