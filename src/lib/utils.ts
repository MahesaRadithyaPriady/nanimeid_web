export const resolveSrc = (src?: string | null) => {
  if (!src) return '';
  
  let baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
  
  // Deteksi lingkungan lokal
  const isLocalEnv = baseUrl.includes('localhost:') || baseUrl.includes('127.0.0.1:') || baseUrl.includes('192.168.');
  
  if (isLocalEnv) {
    baseUrl = 'https://mainappsv1.nanimeid.xyz/2.1.0';
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  let resolvedUrl = src;
  
  // Jika src absolute tapi masih pakai localhost (dari DB lokal), timpa origin-nya
  if (src.includes('localhost:') || src.includes('127.0.0.1:')) {
    try {
      const urlObj = new URL(src);
      // Ganti "http://localhost:3000" dengan cleanBase
      resolvedUrl = src.replace(urlObj.origin, cleanBase);
    } catch {
      // Abaikan jika error
    }
  } else if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
    // Relative path digabung dengan cleanBase
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    resolvedUrl = `${cleanBase}${cleanPath}`;
  }

  // Normalize old CDN bucket path: NanimeID-Storage → storage-nanimeid
  resolvedUrl = resolvedUrl.replace(
    '/file/NanimeID-Storage/',
    '/file/storage-nanimeid/'
  );

  return resolvedUrl;
};
