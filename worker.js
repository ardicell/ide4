addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname === '/track') {
    return handleTrackRequest(request);
  }
  
  // Handle root path
  if (url.pathname === '/') {
    return serveAsset('index.html');
  }
  
  // Handle other assets
  const assetPath = url.pathname.substring(1);
  if (['index.html', 'style.css'].includes(assetPath)) {
    return serveAsset(assetPath);
  }
  
  // Handle resi sharing
  if (url.pathname.startsWith('/resi/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts.length === 4) {
      const waybillNo = pathParts[2];
      const pin = pathParts[3];
      return Response.redirect(`/?resi=${waybillNo}&pin=${pin}`, 302);
    }
  }
  
  return new Response('Not found', { status: 404 });
}

async function serveAsset(assetName) {
  // Get the asset from KV
  const asset = await __STATIC_CONTENT.get(assetName);
  
  if (!asset) {
    return new Response('Asset not found', { status: 404 });
  }
  
  // Determine content type
  let contentType = 'text/plain';
  if (assetName.endsWith('.html')) contentType = 'text/html';
  if (assetName.endsWith('.css')) contentType = 'text/css';
  
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