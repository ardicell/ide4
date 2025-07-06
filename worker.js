addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Serve root path with index.html
  if (url.pathname === '/') {
    return serveAsset('index.html');
  }
  
  // Serve other assets
  const assetPath = url.pathname.substring(1);
  if (assetPath === 'style.css' || assetPath === 'index.html') {
    return serveAsset(assetPath);
  }
  
  // Handle tracking requests
  if (url.pathname === '/track') {
    return handleTrackRequest(request);
  }
  
  return new Response('Not found', { status: 404 });
}

async function serveAsset(assetName) {
  // Get the asset from the global ASSETS environment variable
  const asset = await ASSETS.get(assetName);
  
  if (!asset) {
    return new Response('Asset not found', { status: 404 });
  }
  
  // Determine content type
  let contentType = 'text/plain';
  if (assetName.endsWith('.html')) {
    contentType = 'text/html';
  } else if (assetName.endsWith('.css')) {
    contentType = 'text/css';
  }
  
  return new Response(asset, {
    headers: { 'Content-Type': contentType },
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