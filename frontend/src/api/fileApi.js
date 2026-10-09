import { getAuthToken, API_BASE_URL } from './client';

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
            url: fileUrl,
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
