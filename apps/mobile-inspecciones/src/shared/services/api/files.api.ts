import { API_URL } from '../http-client';
import { useMobileSession } from '../../../modules/auth/mobileSession.store';
import { Platform } from 'react-native';

export interface FileResponse {
  id: string;
  originalFilename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
}

async function appendFilePart(formData: FormData, uri: string, filename: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to read local file for upload: ${response.status}`);
    }
    const blob = await response.blob();
    const file = new File([blob], filename, { type: mimeType || blob.type || 'application/octet-stream' });
    formData.append('file', file);
    return;
  }

  formData.append('file', { uri, type: mimeType, name: filename } as unknown as Blob);
}

export async function uploadFile(uri: string, filename: string, mimeType = 'image/jpeg'): Promise<FileResponse> {
  const formData = new FormData();
  await appendFilePart(formData, uri, filename, mimeType);

  const state = useMobileSession.getState();
  const token = state.accessToken;
  const uploadedByUserId = state.user?.id;
  const query = uploadedByUserId ? `?uploadedByUserId=${encodeURIComponent(uploadedByUserId)}` : '';

  const response = await fetch(`${API_URL}/files/upload${query}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return (await response.json()) as FileResponse;
}
