addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const url = new URL(event.request.url);
  
  // Tangani permintaan aset statis
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return serveAsset('index.html', event);
  }
  
  if (url.pathname === '/style.css') {
    return serveAsset('style.css', event);
  }
  
  // Tangani permintaan tracking
  if (url.pathname === '/track') {
    return handleTrackRequest(event.request);
  }
  
  return new Response('Not found', { status: 404 });
}

async function serveAsset(assetName, event) {
  try {
    // Dapatkan aset dari sistem file
    const asset = await __STATIC_CONTENT.get(assetName);
    
    if (!asset) {
      return new Response('Asset not found', { status: 404 });
    }
    
    // Tentukan content type
    const contentType = assetName.endsWith('.css') 
      ? 'text/css' 
      : 'text/html';
    
    return new Response(asset, {
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    return new Response('Error loading asset', { status: 500 });
  }
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