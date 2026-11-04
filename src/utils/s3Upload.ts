/**
 * HTK Network S3 Upload Utility
 * Handles reliable vehicle & document file uploads with automatic fallback mechanisms.
 * Direct backend proxy + JSON base64 fallback to prevent iframe cookie-check redirects.
 */

export interface S3UploadResult {
  success: boolean;
  file_url: string;
  direct_link: string;
  file_slug?: string;
  file_name: string;
  file_size?: number;
}

export async function uploadFileToHTKS3(
  file: File,
  caption?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  const fileCaption = caption || file.name || 'Vehicle Photo';
  
  // Strategy 1: Multipart upload through /api/upload with credentials: 'include'
  try {
    if (onProgress) onProgress(`Uploading ${file.name} to HTK S3 network...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', fileCaption);
    formData.append('file_name', file.name);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.file_url || data.direct_link) {
        return data.direct_link || data.file_url;
      }
    }
    console.warn('[S3 Upload] Multipart upload failed or redirected, trying Base64 JSON fallback...');
  } catch (err) {
    console.warn('[S3 Upload] Multipart exception, proceeding to Base64 JSON fallback:', err);
  }

  // Strategy 2: Base64 JSON upload to /api/upload (immune to iframe multipart redirect issues)
  try {
    if (onProgress) onProgress(`Encoding ${file.name} for secure S3 transport...`);
    const base64Data = await fileToBase64(file);

    const jsonRes = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        file_base64: base64Data,
        file_name: file.name,
        caption: fileCaption,
      }),
    });

    const jsonData = await jsonRes.json();
    if (jsonRes.ok && (jsonData.file_url || jsonData.direct_link)) {
      return jsonData.direct_link || jsonData.file_url;
    } else {
      throw new Error(jsonData.error || 'Base64 upload to HTK S3 failed');
    }
  } catch (err: any) {
    console.error('[S3 Upload] Both upload methods failed:', err);
    throw new Error(err.message || `Failed to upload ${file.name} to S3 network`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
