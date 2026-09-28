import { useEffect, useState } from 'react';
import client from './api/client';
import UploadPanel from './components/UploadPanel';

function App() {
  const [assets, setAssets] = useState([]);

  async function loadAssets() {
    const res = await client.get('/api/assets');
    setAssets(res.data);
  }

  useEffect(() => {
    loadAssets();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
      <h1>Content Firewall</h1>
      <UploadPanel onAssetRegistered={loadAssets} />
      <ul>
        {assets.map((asset) => {
          const results = Object.values(asset.checks);
          const passed = results.filter((c) => c.passed).length;
          return (
            <li key={asset._id}>
              {asset.cloudinaryPublicId}: {passed} of {results.length} checks passed ({asset.decision})
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;