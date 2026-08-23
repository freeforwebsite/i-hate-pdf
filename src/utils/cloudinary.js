// Cloudinary Direct Client-Side Storage Engine for I HATE PDF

// Default or Environment Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || localStorage.getItem('ihatepdf_cloudinary_name') || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || localStorage.getItem('ihatepdf_cloudinary_preset') || '',
};

// Save custom credentials if configured via UI
export function setCloudinaryConfig(cloudName, uploadPreset) {
  CLOUDINARY_CONFIG.cloudName = cloudName;
  CLOUDINARY_CONFIG.uploadPreset = uploadPreset;
  localStorage.setItem('ihatepdf_cloudinary_name', cloudName);
  localStorage.setItem('ihatepdf_cloudinary_preset', uploadPreset);
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset);
}

// Direct Unsigned Upload to Cloudinary
export async function uploadToCloudinary(fileBlob, fileName, tags = ['ihatepdf', '7day_vault']) {
  if (!isCloudinaryConfigured()) {
    console.log('Cloudinary not configured yet. Falling back to local storage.');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('tags', tags.join(','));

    // Determine resource type: 'raw' for PDFs/DOCX, 'image' for images
    const isImage = fileBlob.type.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Cloudinary upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      publicId: data.public_id,
      secureUrl: data.secure_url,
      format: data.format || fileName.split('.').pop(),
      bytes: data.bytes,
      createdAt: data.created_at || new Date().toISOString(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from upload
    };
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    return null;
  }
}
