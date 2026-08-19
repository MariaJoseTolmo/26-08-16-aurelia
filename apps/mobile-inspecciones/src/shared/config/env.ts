function readRequiredEnv(name: 'EXPO_PUBLIC_API_URL' | 'EXPO_PUBLIC_WEB_PARENT_ORIGIN', value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required environment variable ${name}`);
  return normalized;
}

export const env = {
  apiUrl: readRequiredEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
  webParentOrigin: readRequiredEnv('EXPO_PUBLIC_WEB_PARENT_ORIGIN', process.env.EXPO_PUBLIC_WEB_PARENT_ORIGIN),
};