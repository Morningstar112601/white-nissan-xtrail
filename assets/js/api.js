// api.js — Shared API fetcher with Live Cloud Backend & GitHub Pages support

// Live Render Backend URL (Will be updated with your Render Web Service URL)
const LIVE_BACKEND_URL = window.location.hostname.includes('github.io')
  ? 'https://jerichofalsario-portfolio.onrender.com'
  : '';

function getApiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  if (LIVE_BACKEND_URL) {
    return `${LIVE_BACKEND_URL}/api${path}`;
  }
  return `/api${path}`;
}

async function fetchApiData(endpoint) {
  // 1. Try live Node Express API first (Localhost or Render Cloud Server)
  try {
    const url = getApiUrl(endpoint);
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Live API call to ${endpoint} unreachable, falling back to static cache.`);
  }

  // 2. Fallback to portfolio_data.json if Cloud API is spinning up
  try {
    const dbRes = await fetch('portfolio_data.json');
    if (dbRes.ok) {
      const db = await dbRes.json();
      if (endpoint === 'settings') return db.settings || {};
      if (endpoint === 'projects') {
        const projs = db.projects || [];
        return projs.map(p => {
          let imagesList = [];
          if (p.images) {
            try { imagesList = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; } catch(e) {}
          } else if (p.image_url) {
            imagesList = [p.image_url];
          }
          return {
            ...p,
            images: imagesList,
            image_url: imagesList[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
          };
        });
      }
      if (endpoint === 'skills') return db.skills || [];
      if (endpoint === 'experience') return db.experiences || [];
    }
  } catch (err) {
    console.error('Static fallback load error:', err);
  }

  return endpoint === 'settings' ? {} : [];
}
