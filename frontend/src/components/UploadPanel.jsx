import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

function UploadPanel({ onAssetRegistered }) {
  const widgetRef = useRef(null);
  const callbackRef = useRef(onAssetRegistered);
  const [status, setStatus] = useState('');

  // Keep the latest callback without recreating the widget
  callbackRef.current = onAssetRegistered;

  useEffect(() => {
    if (!window.cloudinary) {
      setStatus('Cloudinary widget script did not load. Check index.html.');
      return;
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        sources: ['local'],
        multiple: true,
        resourceType: 'image'
      },
      async (error, result) => {
        if (error) {
          setStatus(`Upload failed: ${error.message || 'unknown error'}`);
          return;
        }

        // The widget fires "success" once per uploaded file
        if (result.event === 'success') {
          const publicId = result.info.public_id;
          try {
            const res = await client.post('/api/assets', { publicId });
            callbackRef.current?.(res.data);
            setStatus(`Registered ${publicId}`);
          } catch (err) {
            setStatus(`Registration failed: ${err.response?.data?.error || err.message}`);
          }
        }
      }
    );
  }, []);

  return (
    <div>
      <button onClick={() => widgetRef.current?.open()}>Upload assets</button>
      <p>{status}</p>
    </div>
  );
}

export default UploadPanel;