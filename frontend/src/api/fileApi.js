import { getAuthToken, API_BASE_URL, apiDelete } from './client';

/**
 * Resolves a file URL or path for display/download in the frontend.
 * - Leaves absolute URLs (http, https, data:, blob:) unchanged (including Bunny CDN URLs).
 * - Resolves relative /api/files/... paths using backend API_BASE_URL origin.
 * - Resolves bare UUIDs or file paths to /api/files/{id}.
 * 
 * @param {string} urlOrPath 
 * @returns {string} Fully resolved accessible URL
 */
export function resolveFileUrl(urlOrPath) {
  if (!urlOrPath) return '';
  if (typeof urlOrPath !== 'string') return '';

  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';

  // Already fully qualified URLs or in-memory blobs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Prepend backend origin to relative /api/ paths
  if (trimmed.startsWith('/api/')) {
    try {
      const baseObj = new URL(API_BASE_URL, window.location.origin);
      return `${baseObj.origin}${trimmed}`;
    } catch {
      return trimmed;
    }
  }

  // Handle files/{id}
  if (trimmed.startsWith('files/')) {
    return resolveFileUrl(`/api/${trimmed}`);
  }

  // Handle UUID identifier directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return resolveFileUrl(`/api/files/${trimmed}`);
  }

  // Handle standard relative paths starting with /
  if (trimmed.startsWith('/')) {
    try {
      const baseObj = new URL(API_BASE_URL, window.location.origin);
      return `${baseObj.origin}${trimmed}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Fetch a temporary signed link for a private stored file.
 * 
 * @param {string} fileId 
 * @returns {Promise<{ id: string, url: string, expiresAt: number, isPublic: boolean }>}
 */
export async function getFileLink(fileId) {
  if (!fileId) return null;
  const token = getAuthToken();
  const headers = { 'Accept': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(fileId)}/link`, {
    headers
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve file link: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data && data.success && data.data) {
    return {
      ...data.data,
      url: resolveFileUrl(data.data.url)
    };
  }
  throw new Error(data?.message || 'Failed to retrieve file link');
}

/**
 * Upload a file to the backend file storage system with progress callback.
 * 
 * @param {File} file - The file object to upload
 * @param {string} category - Category string (e.g. 'avatar', 'thumbnail', 'banner', 'notes', 'submission')
 * @param {function} onProgress - Callback (percentage integer 0..100)
 * @returns {Promise<{ id: string, url: string, name: string, size: number, contentType: string }>}
 */
export async function uploadFile(file, category = 'document', onProgress = null) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided for upload.'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/files`);

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          const data = response.data || {};
          const fileUrl = data.url || `/api/files/${data.id}`;
          resolve({
            id: data.id,
            url: resolveFileUrl(fileUrl),
            name: data.name || file.name,
            size: data.size || file.size,
            contentType: data.contentType || file.type
          });
        } else {
          const msg = response.message || `Upload failed with status ${xhr.status}`;
          reject(new Error(msg));
        }
      } catch (err) {
        reject(new Error('Failed to parse upload server response'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload request timed out'));
    };

    xhr.send(formData);
  });
}

/**
 * Delete a stored file from storage and database.
 * 
 * @param {string} fileId
 * @returns {Promise<any>}
 */
export async function deleteFile(fileId) {
  if (!fileId) return null;
  return apiDelete(`/files/${encodeURIComponent(fileId)}`);
}

/**
 * Returns absolute download URL for a public rules document.
 * 
 * @param {string} rulesPdfUrl
 * @returns {string} Absolute download URL
 */
export function getRulesDownloadUrl(rulesPdfUrl) {
  if (!rulesPdfUrl) return '';
  const match = rulesPdfUrl.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const fileId = match ? match[0] : rulesPdfUrl.replace(/^\/api\/files\//, '').replace(/\/download$/, '');
  const baseObj = new URL(API_BASE_URL, window.location.origin);
  return `${baseObj.origin}/api/files/${encodeURIComponent(fileId)}/download`;
}

