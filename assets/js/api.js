// api.js — Shared API fetcher with GitHub Pages static fallback

async function fetchApiData(endpoint) {
  // 1. Try live Node Express API first
  try {
    const res = await fetch('/api/' + endpoint);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // API endpoint unreachable (e.g. static hosting on GitHub Pages)
  }

  // 2. Fallback to portfolio_data.json for GitHub Pages static hosting
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
