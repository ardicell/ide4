addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Tangani permintaan API tracking
  if (url.pathname === '/track') {
    return handleTrackRequest(request);
  }
  
  // Tangani permintaan aset statis
  return serveAsset(request);
}

async function serveAsset(request) {
  const url = new URL(request.url);
  let assetPath = url.pathname === '/' ? 'index.html' : url.pathname.substring(1);
  
  // Hanya izinkan file yang diketahui
  const allowedAssets = ['index.html', 'style.css'];
  if (!allowedAssets.includes(assetPath)) {
    return new Response('Not found', { status: 404 });
  }
  
  // Dapatkan aset dari lingkungan
  const asset = await __STATIC_CONTENT.get(assetPath);
  
  if (!asset) {
    return new Response('Asset not found', { status: 404 });
  }
  
  // Tentukan content type
  let contentType = 'text/plain';
  if (assetPath.endsWith('.html')) contentType = 'text/html';
  if (assetPath.endsWith('.css')) contentType = 'text/css';
  
  return new Response(asset, {
    headers: { 
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

async function handleTrackRequest(request) {
  const url = new URL(request.url);
  const noResi = url.searchParams.get('noResi');
  const pin = url.searchParams.get('pin');
  
  if (!noResi || !pin) {
    return new Response(JSON.stringify({
      code: 400,
      message: 'Parameter noResi dan pin diperlukan'
    }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
  
  try {
    const apiUrl = `https://rest.idexpress.com/client/overt/track/attest/web/${noResi},${pin}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      code: 500,
      message: 'Gagal mengambil data dari server'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}