import { useEffect, useRef } from 'react';
import { env } from '../../../shared/config/env';
import { readStoredToken } from '../../../shared/services/session-storage';
import { subscribeInspectionDom } from './inspection-dom-subscription';

const API_ORIGIN = env.apiUrl.replace(/\/api\/?$/, '');
const fileContentPattern = /\/api\/files\/[0-9a-f-]{36}\/content$/i;
const fileMetadataPattern = /^(.*\/api\/files\/[0-9a-f-]{36})\/?$/i;

function toFileContentUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null;
  const clean = trimmed.split('#')[0]?.split('?')[0] ?? '';
  const metadataMatch = clean.match(fileMetadataPattern);
  const contentUrl = fileContentPattern.test(clean)
    ? trimmed
    : metadataMatch?.[1]
      ? trimmed.replace(/\/?$/, '/content')
      : null;
  if (!contentUrl) return null;
  if (/^https?:\/\//i.test(contentUrl)) return contentUrl;
  if (contentUrl.startsWith('/api/')) return `${API_ORIGIN}${contentUrl}`;
  return contentUrl;
}

async function fetchEvidenceObjectUrl(url: string) {
  const headers = new Headers();
  const token = readStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GET evidence image failed: ${response.status}`);
  return URL.createObjectURL(await response.blob());
}

export function InspectionEvidenceImageSourceBridge() {
  const objectUrlsRef = useRef(new Map<string, string>());

  useEffect(() => {
    let active = true;
    const resolveImages = () => {
      const images = Array.from(document.querySelectorAll<HTMLImageElement>('section[role="dialog"] img'));
      images.forEach((image) => {
        if (image.dataset.evidenceBlobLoading === 'true' || image.dataset.evidenceBlobResolved === 'true') return;
        const source = image.dataset.evidenceOriginalSrc ?? image.getAttribute('src') ?? '';
        const url = toFileContentUrl(source);
        if (!url) return;
        image.dataset.evidenceOriginalSrc = url;
        const cached = objectUrlsRef.current.get(url);
        if (cached) {
          if (image.src !== cached) image.src = cached;
          image.dataset.evidenceBlobResolved = 'true';
          return;
        }
        image.dataset.evidenceBlobLoading = 'true';
        fetchEvidenceObjectUrl(url)
          .then((objectUrl) => {
            if (!active) {
              URL.revokeObjectURL(objectUrl);
              return;
            }
            objectUrlsRef.current.set(url, objectUrl);
            if (image.isConnected) {
              image.src = objectUrl;
              image.dataset.evidenceBlobResolved = 'true';
            }
          })
          .catch(() => {
            if (image.isConnected) {
              image.src = url;
              image.dataset.evidenceBlobResolved = 'true';
            }
          })
          .finally(() => {
            delete image.dataset.evidenceBlobLoading;
          });
      });
    };

    const unsubscribeDom = subscribeInspectionDom(resolveImages);
    return () => {
      active = false;
      unsubscribeDom();
      objectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrlsRef.current.clear();
    };
  }, []);

  return null;
}
