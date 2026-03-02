const APP_VERSION = '1.2.0';

const API_BASE = 'https://biblioteca-de-cenas.onrender.com/api';
const SUPABASE_URL = 'https://rposggtfnmqorgjtzpdw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb3NnZ3Rmbm1xb3JnanR6cGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ0MTIsImV4cCI6MjA4NzY5MDQxMn0.Xt_0niciJ8sKFZ0y04Ni7Xv2Ly9fMzVVlAhBA78Iim8';

// Categorias EXATAS do site de referência
const SFX_MAIN_CATEGORIES = {
    'AMBIENCE': ['Aircraft Ambience', 'Beach & Ocean', 'Big Crowds', 'Big Spaces', 'Busy Spaces', 'City',
        'Desert', 'Earth', 'Elements of Nature', 'Extreme Weather', 'Field', 'Forest',
        'Human Powered Ambience', 'Indoor Ambiences', 'Lakes & Rivers', 'Metropolis', 'Nature',
        'Night', 'Outdoor', 'Parks', 'People in the City', 'Public Spaces',
        'Public Transportation Ambience', 'Quiet Crowds', 'Room Tones', 'Sea Vessels Ambience',
        'Skyline', 'Small Spaces', 'Storm', 'Suburbs & Countryside', 'Transport Ambience',
        'Vehicles Ambience', 'Walla', 'Water', 'Weather', 'Wildlife', 'Wind'],
    'FOLEY': ['Accessories', 'Bags', 'Blades', 'Bodily Functions', 'Body Damage', 'Body Falls',
        'Body Hits & Martial Arts', 'Business & Office', 'Clothing', 'Construction',
        'Doors & Windows', 'Fabric', 'Fashion', 'Footsteps', 'Glass & Ceramics', 'High Heels',
        'Home', 'Household Objects', 'Jewelry', 'Kitchen', 'Materials', 'Natural Surfaces',
        'Paper', 'Running', 'Shattering', 'Straps', 'Tools', 'Walking', 'Wood', 'Wooden Floor'],
    'GENRE': ['Aliens', 'Cartoon', 'Cartoon Melodic', 'Cartoon Percussive', 'Cartoon Toys',
        'Cartoon Voices', 'Fantasy & Magic', 'Ghosts', 'Gore', 'Guns', 'Horror', 'Military',
        'Monsters', 'Scary Textures', 'Sci Fi Weapons', 'Sci-Fi & Fantasy', 'Sci-Fi Machines',
        'Spaceships', 'War Hits', 'Weapons & Warfare'],
    'MUSICAL': ['Acoustic Loops', 'Acoustic One Shots', 'Audio Logos', 'Catch Phrase',
        'Drum One Shots', 'Drums Loops', 'Electronic Loops', 'Electronic One Shots',
        'Female Voices', 'Intros', 'Kids', 'Logos', 'Loops & Phrases', 'Male Voices',
        'Melodic Loops', 'Musical Logos', 'One Shots', 'Outros', 'Percussion Loops',
        'Percussion One Shots', 'Processed Vocals', 'Synthetic', 'Tonal One Shots',
        'Vocal Phrases', 'Vocals', 'Voices', 'Voices & Body Sounds'],
    'REALISTIC': ['Air', 'Airplanes', 'Animals', 'Appliances', 'Atmospheres', 'Ball Sports',
        'Bikes & Skateboards', 'Birds', 'Boats & Submarines', 'Boings and Dings', 'Cameras',
        'Cars', 'Computers', 'Crowds', 'Crowd Reactions', 'Debris', 'Demolition', 'Destruction',
        'Devices', 'Diversos', 'Electronics', 'Explosions', 'Extreme Sports', 'Factory',
        'Farm Animals', 'Fire', 'Gaming', 'Glitches', 'Industry & Commercial', 'Insects',
        'Kicks', 'Machines', 'Menus', 'Metal', 'Motorsports', 'Pets', 'Phones', 'Punches',
        'Radio', 'Rain', 'Reactions', 'Sports', 'Spring Sounds', 'Strength & Agility',
        'Technology', 'Trains & Buses', 'Transport', 'TV', 'Water Sports'],
    'TRANSITIONS': ['Airy Impacts', 'Alerts', 'Boings and Dings', 'Cinematic Impacts', 'Crashes',
        'Downers', 'Drones', 'Epic Transitions', 'Hard Impacts', 'Horror Transitions', 'Impacts',
        'Interfaces', 'Long Impacts', 'Long Whooshes', 'Menus', 'Reverse', 'Risers',
        'Scary Textures', 'Short Impacts', 'Short Whooshes', 'Technology', 'Tonal Whooshes', 'Whooshes']
};

let csInterface;
let currentTab = 'videos';
let allVideos = [], currentVideos = [];
let allMusic = [], currentMusic = [];
let allSfx = [], currentSfx = [];
let activeFilter = 'all';          // sub-category filter
let sfxMainCat = 'all';            // SFX main category
let sfxTotalCount = 0;
let sfxCurrentPage = 0;
let musicCurrentPage = 0;
let musicTotalCount = 0;
let musicSearchTerm = '';
let musicMainCat = 'all';          // Music main category (GENERO, MOOD, TEMA, INSTRUMENTO)
let musicActiveCategory = 'all';   // Music sub-category filter
let searchTimer = null;
let activeAudio = null;
let activePlayBtn = null;

// ─────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    csInterface = new CSInterface();
    setupEvents();
    buildSfxMainCatBar();
    buildMusicMainCatBar();
    populateClipYears();

    // Auto-load everything on open
    loadAll();
    loadVideos(); // Initial fetch for movies
    loadSfx();    // Initial fetch for SFX
    loadMusic();  // Initial fetch for Music
});

function populateClipYears() {
    const sel = document.getElementById('clipcafeYear');
    if (!sel) return;
    let html = '<option value="">Todos os anos</option>';
    for (let y = 2025; y >= 1980; y--) html += `<option value="${y}">${y}</option>`;
    sel.innerHTML = html;
    sel.addEventListener('change', () => fetchClipMovies(document.getElementById('searchInput').value, sel.value));
}

function triggerSearch() {
    clearTimeout(searchTimer);
    const q = document.getElementById('searchInput').value;
    if (currentTab === 'sfx') {
        sfxCurrentPage = 0;
        allSfx = [];
        loadSfx();
    } else if (currentTab === 'videos') {
        const year = document.getElementById('clipcafeYear')?.value || '';
        fetchClipMovies(q, year);
    } else {
        applyFilters();
    }
}

function setupEvents() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(triggerSearch, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            triggerSearch();
        }
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        showToast('Atualizando...', 'info');
        if (currentTab === 'sfx') { sfxCurrentPage = 0; allSfx = []; loadSfx(); }
        else loadAll();
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

// ─────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────
function switchTab(tab) {
    if (currentTab === tab) return;

    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    stopAudio();

    // Toggle Pane Visibility
    document.getElementById('videosContent').style.display = (tab === 'videos') ? 'block' : 'none';
    document.getElementById('musicContent').style.display = (tab === 'music') ? 'block' : 'none';
    document.getElementById('sfxContent').style.display = (tab === 'sfx') ? 'block' : 'none';

    const sfxMainCatEl = document.getElementById('sfxMainCats');
    const musicMainCatEl = document.getElementById('musicMainCats');
    const sfxCountBar = document.getElementById('sfxCountBar');
    const musicCountBar = document.getElementById('musicCountBar');
    const filterRow = document.getElementById('filterRow');
    const globalSearch = document.querySelector('.search-bar');
    const selYear = document.getElementById('clipcafeYear');

    // Hide all category bars first
    sfxMainCatEl.style.display = 'none';
    musicMainCatEl.style.display = 'none';
    sfxCountBar.style.display = 'none';
    musicCountBar.style.display = 'none';
    filterRow.style.display = 'none';

    if (tab === 'sfx') {
        if (globalSearch) globalSearch.style.display = 'flex';
        sfxMainCatEl.style.display = 'block';
        sfxCountBar.style.display = 'block';
        if (sfxMainCat !== 'all') filterRow.style.display = 'flex';
        if (selYear) selYear.style.display = 'none';

        if (allSfx.length === 0) {
            loadSfx();
        } else if (!document.querySelector('#sfxContent .sfx-list')) {
            const hasMore = sfxTotalCount > allSfx.length;
            renderSfx(hasMore);
        }
    } else if (tab === 'videos') {
        if (globalSearch) globalSearch.style.display = 'flex';
        if (selYear) selYear.style.display = 'block';

        if (clipMovies.length === 0) {
            loadVideos();
        } else if (!document.querySelector('#videosContent .clip-movie-grid') && !document.querySelector('#clipcafeWrap.detail-mode')) {
            renderMovieGrid();
        }
    } else { // Music
        if (globalSearch) globalSearch.style.display = 'flex';
        if (selYear) selYear.style.display = 'none';
        musicMainCatEl.style.display = 'block';
        musicCountBar.style.display = 'block';
        if (musicMainCat !== 'all') filterRow.style.display = 'flex';

        if (allMusic.length === 0) {
            loadMusic();
        } else {
            renderMusic(musicTotalCount > allMusic.length);
        }
    }
}

// ─────────────────────────────────────────────────
// LOAD ALL
// ─────────────────────────────────────────────────
async function loadAll() {
    loadVideos();
    loadMusic();
    if (currentTab === 'sfx') loadSfx();
}

// ─────────────────────────────────────────────────
// FETCH API HELPER
// ─────────────────────────────────────────────────
async function fetchApi(endpoint) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
}

// ─────────────────────────────────────────────────
// CLIPCAFE — CORTES DE FILMES
// ─────────────────────────────────────────────────
const CLIPCAFE_KEY = 'f68263120929edd8417b0c0ed91535a5';
let clipMovies = [];         // grouped movies
let clipSelectedMovie = null; // currently expanded movie

async function loadVideos() {
    renderClipCafe();
    // Re-fetch trending or recent for initial view (reduced size for speed)
    fetchClipMovies('', '2025');
}

function renderClipCafe() {
    const area = document.getElementById('videosContent');
    area.innerHTML = `
    <div id="clipcafeWrap">
      <div id="clipcafeBody">
        <div class="state-box" style="margin-top:48px">
          <div class="state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></div>
          <p>Buscando...</p>
        </div>
      </div>
    </div>`;
}

let clipSearchAbort = null;
const clipCache = new Map();

async function fetchClipMovies(query, year = '') {
    const body = document.getElementById('clipcafeBody');
    if (!body) {
        renderClipCafe();
        return fetchClipMovies(query, year);
    }
    if (!query && !year) {
        body.innerHTML = '<div class="state-box" style="margin-top:48px"><p>Busque um filme no topo</p></div>';
        return;
    }

    body.innerHTML = '<div class="state-box" style="margin-top:48px"><div class="spinner"></div><p>Buscando filmes...</p></div>';

    // Abort previous search
    if (clipSearchAbort) clipSearchAbort.abort();
    clipSearchAbort = new AbortController();

    const cacheKey = `${query}_${year}`;
    if (clipCache.has(cacheKey)) {
        displayClipMovies(clipCache.get(cacheKey), query);
        return;
    }

    try {
        const size = (query && query.length > 2) ? 1500 : 500;
        let url = `https://api.clip.cafe/?api_key=${CLIPCAFE_KEY}&size=${size}`;
        if (query) url += `&movie_title=${encodeURIComponent(query)}`;
        if (year) url += `&movie_year=${year}`;

        const res = await fetch(url, { signal: clipSearchAbort.signal });
        if (!res.ok) {
            if (res.status === 429) throw new Error("Muitas buscas. Aguarde.");
            throw new Error(`Erro API: ${res.status}`);
        }
        const data = await res.json();
        const hits = data?.hits?.hits || [];

        if (!hits.length) {
            body.innerHTML = `<div class="state-box" style="margin-top:48px"><p>Nada encontrado para "${query}"</p></div>`;
            return;
        }

        // Process hits
        const results = processClipHits(hits);
        clipCache.set(cacheKey, results);
        displayClipMovies(results, query);

    } catch (err) {
        if (err.name === 'AbortError') return;
        body.innerHTML = `<div class="state-box" style="margin-top:48px"><p>Erro: ${err.message}</p></div>`;
    }
}

function processClipHits(hits) {
    const grouped = {};
    const seenClips = new Set();
    for (const h of hits) {
        const s = h._source;
        const slug = s.movie_slug;
        if (!slug) continue;

        const clipId = s.clipID || s.id || Math.random();
        if (seenClips.has(clipId)) continue;
        seenClips.add(clipId);

        if (!grouped[slug]) {
            grouped[slug] = {
                title: s.movie_title,
                slug,
                year: s.movie_year,
                imdb: s.imdb,
                poster: s.movie_poster || `https://clip.cafe/posters/300/${slug}.jpg`,
                clips: []
            };
        }
        grouped[slug].clips.push({ ...s, downloadUrl: s.download });
    }

    return Object.values(grouped)
        .map(m => ({ ...m, clips: m.clips.sort((a, b) => (a.clipID || 0) - (b.clipID || 0)) }))
        .sort((a, b) => b.year - a.year);
}

function displayClipMovies(movies, query) {
    clipMovies = movies;
    document.getElementById('videoTabCount').textContent = movies.length;

    // Ensure year select is visible if we are in video tab
    if (currentTab === 'videos') {
        const sel = document.getElementById('clipcafeYear');
        if (sel) sel.style.display = 'block';
    }

    renderMovieGrid();
}


function renderMovieGrid() {
    const body = document.getElementById('clipcafeBody');
    if (!body) return;

    if (!clipMovies.length) {
        body.innerHTML = '<div class="state-box"><p>Nenhum filme encontrado</p></div>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'clip-movie-grid';

    clipMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'clip-movie-card';
        card.innerHTML = `
          <div class="clip-movie-poster">
            <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.onerror=null; this.src='https://clip.cafe/posters/300/${movie.slug}.jpg'; this.nextSibling && this.nextSibling.style && (this.nextSibling.style.display='flex')"/>
            <div class="clip-movie-year">${movie.year}</div>
          </div>
          <div class="clip-movie-info">
            <div class="clip-movie-title">${movie.title}</div>
            <div class="clip-movie-count">${movie.clips.length} cenas</div>
            <button class="clip-movie-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Ver Cenas
            </button>
          </div>`;
        card.querySelector('.clip-movie-btn').addEventListener('click', () => openClipMovie(movie));
        grid.appendChild(card);
    });

    body.innerHTML = '';
    body.appendChild(grid);
}

async function openClipMovie(movie) {
    clipSelectedMovie = movie;
    const area = document.getElementById('videosContent');

    // Show a loading state inside the detail view first
    area.innerHTML = `
    <div id="clipcafeWrap" class="detail-mode">
      <div class="state-box" style="margin-top:100px"><div class="spinner"></div><p>Carregando todas as cenas...</p></div>
    </div>`;

    // Fetch ALL scenes for this specific movie slug (limit 300 to be safe but exhaustive)
    try {
        const url = `https://api.clip.cafe/?api_key=${CLIPCAFE_KEY}&size=300&movie_slug=${movie.slug}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const hits = data?.hits?.hits || [];
            if (hits.length > 0) {
                const seen = new Set();
                const freshClips = [];
                for (const h of hits) {
                    const s = h._source;
                    // STRICT FILTER: Ensure the slug matches exactly to avoid mixed movies
                    if (s.movie_slug !== movie.slug) continue;

                    const clipId = s.clipID || s.id || Math.random();
                    if (seen.has(clipId)) continue;
                    seen.add(clipId);
                    freshClips.push({ ...s, downloadUrl: s.download });
                }

                if (freshClips.length > 0) {
                    movie.clips = freshClips.sort((a, b) => (a.clipID || 0) - (b.clipID || 0));
                }
            }
        }
    } catch (err) {
        console.error("Erro ao buscar cenas extras:", err);
    }

    // Hide global year selector when inside a movie
    const yearSel = document.getElementById('clipcafeYear');
    if (yearSel) yearSel.style.display = 'none';

    area.innerHTML = `
    <div id="clipcafeWrap" class="detail-mode">
      <div class="clip-top-nav">
        <button class="clip-back-btn-v2" id="clipBackBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Voltar
        </button>
      </div>
      <div class="clip-detail-header-v2">
        <div class="clip-poster-container">
           <img src="${movie.poster}" class="clip-detail-poster-v2" onerror="this.onerror=null; this.src='https://clip.cafe/posters/300/${movie.slug}.jpg'"/>
        </div>
        <div class="clip-header-info">
           <div class="clip-detail-title-v2">${movie.title}</div>
           <div class="clip-detail-meta-v2">${movie.year} • <span id="clipDetailCount">${movie.clips.length}</span> cenas</div>
        </div>
      </div>
      <div id="clipDetailGrid" class="clip-detail-grid"></div>
      <div id="clipLoadMoreArea" class="load-more-container"></div>
    </div>`;

    renderClipGridPaginated(movie, 0);

    document.getElementById('clipBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (yearSel) yearSel.style.display = 'block';
        renderClipCafe();
        renderMovieGrid();
    });

    // Auto-load on scroll
    const areaScroll = document.getElementById('contentArea');
    let loadingMore = false;
    let currentPage = 0;

    areaScroll.onscroll = () => {
        if (loadingMore) return;
        if (areaScroll.scrollTop + areaScroll.clientHeight >= areaScroll.scrollHeight - 100) {
            const total = movie.clips.length;
            if ((currentPage + 1) * CLIP_PAGE_SIZE < total) {
                loadingMore = true;
                currentPage++;
                const loadArea = document.getElementById('clipLoadMoreArea');
                if (loadArea) loadArea.innerHTML = '<div class="spinner" style="margin: 10px auto"></div>';

                setTimeout(() => {
                    renderClipGridPaginated(movie, currentPage);
                    loadingMore = false;
                    if (loadArea) loadArea.innerHTML = '';
                }, 400);
            }
        }
    };

    renderClipGridPaginated(movie, 0);
}

let CLIP_PAGE_SIZE = 12;

function renderClipGridPaginated(movie, page) {
    const grid = document.getElementById('clipDetailGrid');
    const loadMoreArea = document.getElementById('clipLoadMoreArea');
    if (!grid) return;

    if (page === 0) grid.innerHTML = '';

    const start = page * CLIP_PAGE_SIZE;
    const end = start + CLIP_PAGE_SIZE;
    const chunk = movie.clips.slice(start, end);

    if (chunk.length === 0 && page === 0) {
        grid.innerHTML = '<div class="state-box" style="grid-column: span 3"><p>Nenhuma cena disponível.</p></div>';
        return;
    }

    chunk.forEach((c, idx) => {
        if (!c) return;
        const clipSlug = c.slug || c.movie_slug || movie.slug;
        const globalIndex = start + idx + 1;
        let finalDUrl = c.downloadUrl || c.download || c.preview_url || '';

        // Se for Google Drive (ex: de alguma migração)
        const drId = c.drive_id || c.google_drive_id || null;
        if (drId) {
            finalDUrl = `${SUPABASE_URL}/functions/v1/stream-audio-drive?driveId=${drId}&download=1`;
        }

        const div = document.createElement('div');
        div.className = 'clip-scene-card';
        // Fallbacks para Miniatura
        const thumbUrl = `https://clip.cafe/img400/${clipSlug}.jpg`;
        const posterUrl = `https://clip.cafe/posters/300/${movie.slug}.jpg`;

        div.innerHTML = `
            <div class="clip-scene-thumb" style="position:relative; background:#111">
                <img src="${thumbUrl}" loading="lazy" 
                     onerror="this.onerror=null; this.src='${posterUrl}'; this.style.opacity='0.4'"/>
                <div class="clip-scene-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
            </div>
            <div class="clip-scene-title" title="${(c.caption || '').replace(/"/g, '&quot;')}">Cena ${globalIndex}</div>
            <button class="clip-scene-import">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Importar
            </button>`;

        // Preview on thumb click
        div.querySelector('.clip-scene-thumb').onclick = () => openClipPreviewLocal(finalDUrl, c.caption || movie.title);

        // Import
        const btn = div.querySelector('.clip-scene-import');
        btn.onclick = (e) => {
            e.stopPropagation();
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner-small"></div> baixando...';
            importClipCafeVideo(finalDUrl, (c.caption || movie.title).substring(0, 40), btn);
        };

        grid.appendChild(div);
    });

    // Load More Button
    if (end < movie.clips.length) {
        loadMoreArea.innerHTML = `
            <button class="clip-load-more-btn">
                Carregar mais cenas (${movie.clips.length - end} restantes)
            </button>
        `;
        loadMoreArea.querySelector('button').onclick = () => {
            loadMoreArea.innerHTML = '<div class="spinner" style="margin: 10px auto"></div>';
            setTimeout(() => renderClipGridPaginated(movie, page + 1), 300);
        };
    } else {
        loadMoreArea.innerHTML = '';
    }
}


// ─────────────────────────────────────────────────
// CLIP PREVIEW LOCAL (baixa temp → file://)
// ─────────────────────────────────────────────────
async function openClipPreviewLocal(videoUrl, title) {
    if (!videoUrl) { showToast('Sem URL de preview', 'error'); return; }

    // Remove modal anterior
    const existing = document.getElementById('clipPreviewModal');
    if (existing) existing.remove();

    // Monta modal com loading
    const modal = document.createElement('div');
    modal.id = 'clipPreviewModal';
    modal.style.cssText = `
        position:fixed; inset:0; z-index:9999;
        background:rgba(0,0,0,0.93);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        padding:16px;
    `;
    modal.innerHTML = `
        <div id="clipPreviewBox" style="width:100%; max-width:640px; background:#0f0f0f; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); box-shadow:0 24px 80px rgba(0,0,0,0.9);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.07); background:#141414;">
                <span style="font-size:10px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80%;">${title}</span>
                <button id="clipPreviewClose" style="background:rgba(255,60,60,0.15); border:1px solid rgba(255,60,60,0.25); color:#ff6b6b; border-radius:6px; padding:4px 12px; cursor:pointer; font-size:10px; font-weight:800; letter-spacing:.05em;">✕ FECHAR</button>
            </div>
            <div id="clipPreviewContent" style="width:100%; aspect-ratio:16/9; background:#000; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px; min-height:220px;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(160,255,109,0.7)" stroke-width="2" class="spin-icon" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span style="font-size:9px; color:#666; font-weight:700; text-transform:uppercase; letter-spacing:.15em;">Carregando preview...</span>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => { if (e.target === modal) closePreviewModal(); });
    modal.querySelector('#clipPreviewClose').addEventListener('click', closePreviewModal);
    document.body.appendChild(modal);

    function closePreviewModal() {
        const m = document.getElementById('clipPreviewModal');
        if (m) {
            const vid = m.querySelector('video');
            if (vid) { vid.pause(); vid.src = ''; }
            m.remove();
        }
        // Apaga arquivo temporário
        if (window._clipPreviewTempFile) {
            try {
                const fs = require('fs');
                fs.unlink(window._clipPreviewTempFile, () => { });
            } catch (e) { }
            window._clipPreviewTempFile = null;
        }
    }

    try {
        const path = require('path');
        const os = require('os');
        const fs = require('fs');

        const tmpFile = path.join(os.tmpdir(), `clip_preview_${Date.now()}.mp4`);
        window._clipPreviewTempFile = tmpFile;

        await downloadFileNode(videoUrl, tmpFile);

        // Confirma que o arquivo existe e tem tamanho
        if (!fs.existsSync(tmpFile) || fs.statSync(tmpFile).size < 1000) {
            throw new Error('Arquivo de preview vazio ou inválido');
        }

        const content = document.getElementById('clipPreviewContent');
        if (!content) return; // Modal foi fechado durante download

        // Converte path Windows para URL file://
        const fileUrl = 'file:///' + tmpFile.replace(/\\/g, '/');

        content.innerHTML = `
            <video
                src="${fileUrl}"
                controls
                autoplay
                style="width:100%; height:100%; max-height:360px; background:#000; display:block; outline:none;"
            ></video>
        `;

    } catch (err) {
        const content = document.getElementById('clipPreviewContent');
        if (content) {
            content.innerHTML = `<span style="font-size:9px; color:#ff6b6b; font-weight:700; text-transform:uppercase; letter-spacing:.1em; padding:20px;">Erro ao carregar preview</span>`;
        }
        console.error('Preview err:', err);
    }
}

async function downloadFileNode(url, dest, _attempt) {
    const attempt = _attempt || 1;
    const MAX_ATTEMPTS = 3;
    const fs = require('fs');
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');

    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
                'Referer': 'https://clip.cafe/',
                'Origin': 'https://clip.cafe'
            },
            timeout: 60000
        };

        // Remove arquivo de tentativa anterior se existir
        try { if (fs.existsSync(dest)) fs.unlinkSync(dest); } catch (e) { }

        const request = protocol.get(url, options, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFileNode(response.headers.location, dest, attempt).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                if (response.statusCode === 403) {
                    reject(new Error(`Acesso Negado (403) pela Clip.Cafe. Tente novamente em instantes.`));
                } else {
                    reject(new Error(`Erro HTTP: ${response.statusCode}`));
                }
                return;
            }

            const file = fs.createWriteStream(dest);
            response.pipe(file);

            response.on('error', (err) => {
                file.destroy();
                fs.unlink(dest, () => { });
                // Retry on connection reset
                if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') && attempt < MAX_ATTEMPTS) {
                    console.log(`[Download] Retry ${attempt}/${MAX_ATTEMPTS} por ${err.code}...`);
                    setTimeout(() => downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject), 2000);
                } else {
                    reject(err);
                }
            });

            file.on('finish', () => { file.close(); });

            file.on('close', () => {
                setTimeout(resolve, 2000);
            });

            file.on('error', (err) => {
                fs.unlink(dest, () => { });
                reject(err);
            });
        });

        request.on('error', (err) => {
            // Retry on ECONNRESET/ETIMEDOUT network errors
            if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') && attempt < MAX_ATTEMPTS) {
                console.log(`[Download] Retry ${attempt}/${MAX_ATTEMPTS} por ${err.code}...`);
                setTimeout(() => downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject), 2000);
            } else {
                reject(err);
            }
        });

        request.setTimeout(90000, () => {
            request.destroy();
            if (attempt < MAX_ATTEMPTS) {
                setTimeout(() => downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject), 2000);
            } else {
                reject(new Error('Timeout de conexão (90s)'));
            }
        });
    });
}

async function importClipCafeVideo(videoUrl, title, btn) {
    if (!videoUrl) { showToast('Cena sem URL', 'error'); return; }
    showToast('⬇ Baixando cena...', 'info');

    try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const libPath = path.join(os.homedir(), 'Documents', 'EditorMaster_Library', 'Filmes');
        if (!fs.existsSync(libPath)) { try { fs.mkdirSync(libPath, { recursive: true }); } catch (e) { } }

        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
        const finalPath = path.join(libPath, `${safeTitle}_${Date.now()}.mp4`);

        await downloadFileNode(videoUrl, finalPath);

        const stats = fs.statSync(finalPath);
        if (stats.size < 1000) throw new Error('Arquivo baixado está vazio ou inválido');

        // Codifica em base64 para evitar erros de escape por chars especiais nos títulos
        const b64Path = btoa(unescape(encodeURIComponent(finalPath)));
        const b64Title = btoa(unescape(encodeURIComponent(title)));

        csInterface.evalScript(`importLocalVideo("${b64Path}", "${b64Title}", true)`, result => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar';
            }
            if (!result || result === 'EvalScript error.') {
                showToast('Erro interno Premiere: ' + (result || 'null'), 'error');
            } else if (result.startsWith('SUCCESS_POOL')) {
                showToast('✓ ' + title.substring(0, 28) + ' no Media Pool!', 'info');
            } else if (result.startsWith('ERROR:')) {
                showToast(result.replace('ERROR:', '').trim(), 'error');
            } else {
                showToast('✓ ' + title.substring(0, 28) + ' na timeline!', 'success');
            }
        });

    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar';
        }
        showToast('Erro: ' + err.message.substring(0, 80), 'error');
    }
}

// ─────────────────────────────────────────────────
// MUSIC — SUPABASE
// ─────────────────────────────────────────────────
const MUSIC_MAIN_CATEGORIES = {
    'GÊNERO': [
        'Blues', 'Children', 'Classical', 'Country', 'Electronic', 'Folk', 'Funk',
        'Hip Hop', 'Indie', 'Jazz', 'Latin', 'Lofi & Chill Beats', 'Lounge', 'Pop',
        'Reggae', 'Retro', 'Rock', 'Singer-Songwriter', 'Soul & RnB', 'World', 'Worship'
    ],
    'MOOD': [
        'Ambient', 'Fantasy', 'Cinematic', 'Lounge'
    ],
    'TEMA DE VÍDEO': [
        'Cinematic', 'Corporate', 'Holiday', 'World', 'Children'
    ],
    'INSTRUMENTO': [
        'Acoustic'
    ]
};

async function loadMusic(page = 0) {
    if (page === 0 && currentTab === 'music') showLoading();
    const limit = 50;
    const offset = page * limit;
    const q = document.getElementById('searchInput').value.trim();

    try {
        let url = `${SUPABASE_URL}/rest/v1/music_library?select=id,titulo,artista,categorias,duracao,capa,picos,Cloud_R2_url&order=titulo.asc&limit=${limit}&offset=${offset}`;
        if (q) url += `&or=(titulo.ilike.*${encodeURIComponent(q)}*,artista.ilike.*${encodeURIComponent(q)}*)`;
        if (musicActiveCategory && musicActiveCategory !== 'all') {
            url += `&categorias=cs.${encodeURIComponent('["' + musicActiveCategory + '"]')}`;
        }

        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Accept': 'application/json',
                'Prefer': 'count=exact'
            }
        });
        if (!res.ok) throw new Error(`Supabase ${res.status}`);

        const countHeader = res.headers.get('content-range');
        if (countHeader) {
            const match = countHeader.match(/\/(\d+)/);
            if (match) musicTotalCount = parseInt(match[1]);
        }

        const data = await res.json();
        const mapped = data.map(item => ({
            id: item.id,
            titulo: item.titulo || 'Sem título',
            artista: item.artista || '',
            categorias: Array.isArray(item.categorias) ? item.categorias : [],
            duracao: item.duracao || 0,
            capa: item.capa || '',
            picos: Array.isArray(item.picos) ? item.picos : null,
            url: item.Cloud_R2_url || ''
        }));

        if (page === 0) {
            allMusic = mapped;
        } else {
            allMusic = [...allMusic, ...mapped];
        }
        currentMusic = allMusic;
        musicCurrentPage = page;

        const total = musicTotalCount || allMusic.length;
        document.getElementById('musicTabCount').textContent = total > 1000 ? (total / 1000).toFixed(0) + 'k' : total;
        const cntEl = document.getElementById('musicCountNum');
        if (cntEl) cntEl.textContent = total.toLocaleString('pt-BR');

        if (currentTab === 'music') {
            renderMusic(data.length === limit);
        }
    } catch (err) {
        if (currentTab === 'music') showError('Erro ao carregar músicas: ' + err.message, () => loadMusic(0));
    }
}

// ─────────────────────────────────────────────────
// MUSIC — MAIN CATEGORY BAR (igual ao SFX)
// ─────────────────────────────────────────────────
function buildMusicMainCatBar() {
    const row = document.getElementById('musicMainCatRow');
    if (!row) return;
    row.innerHTML = '';

    const allTab = document.createElement('div');
    allTab.className = 'sfx-main-tab active';
    allTab.textContent = 'TODOS';
    allTab.addEventListener('click', () => {
        musicMainCat = 'all';
        musicActiveCategory = 'all';
        allMusic = [];
        document.getElementById('filterRow').style.display = 'none';
        highlightMusicMainCat('all');
        loadMusic(0);
    });
    row.appendChild(allTab);

    Object.keys(MUSIC_MAIN_CATEGORIES).forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'sfx-main-tab';
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            musicMainCat = cat;
            musicActiveCategory = 'all';
            allMusic = [];
            highlightMusicMainCat(cat);
            buildMusicSubFilters();
            loadMusic(0);
        });
        row.appendChild(btn);
    });
}

function highlightMusicMainCat(cat) {
    const row = document.getElementById('musicMainCatRow');
    if (!row) return;
    row.querySelectorAll('.sfx-main-tab').forEach(el => {
        el.classList.toggle('active',
            (cat === 'all' && el.textContent === 'TODOS') ||
            el.textContent === cat);
    });
}

// ─────────────────────────────────────────────────
// MUSIC — SUB-CATEGORY PILLS
// ─────────────────────────────────────────────────
function buildMusicSubFilters() {
    const row = document.getElementById('filterRow');
    row.innerHTML = '<div class="filter-pill active" data-filter="all">Todos</div>';

    let subcats = musicMainCat !== 'all' ? (MUSIC_MAIN_CATEGORIES[musicMainCat] || []) : [];
    subcats = [...new Set(subcats)];

    subcats.forEach(cat => {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.dataset.filter = cat;
        pill.textContent = cat;
        row.appendChild(pill);
    });

    row.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            row.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            musicActiveCategory = pill.dataset.filter;
            allMusic = [];
            loadMusic(0);
        });
    });

    row.style.display = (subcats.length === 0) ? 'none' : 'flex';
}

function buildMusicCategoryFilters() { buildMusicSubFilters(); }
function buildMusicFilters() { buildMusicSubFilters(); }

// ─────────────────────────────────────────────────
// SFX — SUPABASE
// ─────────────────────────────────────────────────
async function loadSfx() {
    if (sfxCurrentPage === 0 && currentTab === 'sfx') showLoading();

    const limit = 100;
    const offset = sfxCurrentPage * limit;
    const q = document.getElementById('searchInput').value.trim();

    try {
        // Base URL
        let url = `${SUPABASE_URL}/rest/v1/sfx_library?select=id,titulo,categorias,Cloud_R2_url,google_drive_id,duracao,picos&order=titulo.asc&limit=${limit}&offset=${offset}`;

        // Search filter
        if (q) {
            url += `&titulo=ilike.*${encodeURIComponent(q)}*`;
        }

        // Sub-category filter — PostgREST array contains: categorias=cs.{"value"}
        if (activeFilter && activeFilter !== 'all') {
            // encodeURIComponent so & in names doesn't break query params
            url += '&categorias=' + encodeURIComponent(`cs.{"${activeFilter}"}`);
        }
        // Main category filter (all sub-cats as overlap)
        else if (sfxMainCat && sfxMainCat !== 'all') {
            const subcats = SFX_MAIN_CATEGORIES[sfxMainCat] || [];
            if (subcats.length) {
                // encodeURIComponent so & in names doesn't break query params
                const filterVal = `ov.{${subcats.map(s => `"${s}"`).join(',')}}`;
                url += '&categorias=' + encodeURIComponent(filterVal);
            }
        }

        console.log('[SFX] Fetching:', url);

        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Accept': 'application/json',
                'Prefer': 'count=exact'
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Supabase erro ${res.status}: ${errText.substring(0, 80)}`);
        }

        // Get total count from header
        const countHeader = res.headers.get('content-range');
        if (countHeader) {
            const match = countHeader.match(/\/(\d+)/);
            if (match) sfxTotalCount = parseInt(match[1]);
        }

        const data = await res.json();
        const mapped = data
            .map(item => ({
                id: item.id,
                titulo: item.titulo || 'Sem título',
                categorias: Array.isArray(item.categorias) ? item.categorias : [],
                url: item.Cloud_R2_url || '',
                driveId: item.google_drive_id || '',
                duracao: item.duracao || 0,
                picos: Array.isArray(item.picos) ? item.picos : null
            }));

        if (sfxCurrentPage === 0) {
            allSfx = mapped;
        } else {
            allSfx = [...allSfx, ...mapped];
        }
        currentSfx = allSfx;

        const total = sfxTotalCount || allSfx.length;
        document.getElementById('sfxTabCount').textContent = total > 1000
            ? (total / 1000).toFixed(0) + 'k'
            : total;
        document.getElementById('sfxCountNum').textContent = total.toLocaleString('pt-BR');

        if (currentTab === 'sfx') {
            renderSfx(data.length === limit);
            // Re-highlight active pill (não reconstruir — perderia o estado)
            const row = document.getElementById('filterRow');
            row.querySelectorAll('.filter-pill').forEach(p => {
                p.classList.toggle('active', p.dataset.filter === activeFilter);
            });
        }

    } catch (err) {
        if (currentTab === 'sfx') showError('Erro SFX: ' + err.message, () => { sfxCurrentPage = 0; allSfx = []; loadSfx(); });
    }
}

// ─────────────────────────────────────────────────
// SFX — MACRO CATEGORY BAR
// ─────────────────────────────────────────────────
function buildSfxMainCatBar() {
    const row = document.getElementById('sfxMainCatRow');
    row.innerHTML = '';

    // "Todos" tab
    const allTab = document.createElement('div');
    allTab.className = 'sfx-main-tab active';
    allTab.textContent = 'TODOS';
    allTab.addEventListener('click', () => {
        sfxMainCat = 'all';
        activeFilter = 'all';
        sfxCurrentPage = 0;
        allSfx = [];
        document.getElementById('filterRow').style.display = 'none';
        highlightSfxMainCat('all');
        loadSfx();
    });
    row.appendChild(allTab);

    Object.keys(SFX_MAIN_CATEGORIES).forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'sfx-main-tab';
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            sfxMainCat = cat;
            activeFilter = 'all';
            sfxCurrentPage = 0;
            allSfx = [];
            highlightSfxMainCat(cat);
            buildSfxSubFilters();
            loadSfx();
        });
        row.appendChild(btn);
    });
}

function highlightSfxMainCat(cat) {
    document.querySelectorAll('.sfx-main-tab').forEach(el => {
        el.classList.toggle('active',
            (cat === 'all' && el.textContent === 'TODOS') ||
            el.textContent === cat);
    });
}

// ─────────────────────────────────────────────────
// SFX — SUB-CATEGORY PILLS
// ─────────────────────────────────────────────────
function buildSfxSubFilters() {
    const row = document.getElementById('filterRow');
    row.innerHTML = '<div class="filter-pill active" data-filter="all">Todos</div>';

    let subcats = [];
    if (sfxMainCat !== 'all') {
        subcats = SFX_MAIN_CATEGORIES[sfxMainCat] || [];
    } else {
        // In 'TODOS' tab, don't show any sub-filters as requested
        subcats = [];
    }

    // Deduplicate and sort
    subcats = [...new Set(subcats)].sort();

    subcats.forEach(cat => {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.dataset.filter = cat;
        pill.textContent = cat.toUpperCase();
        row.appendChild(pill);
    });

    row.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            row.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.dataset.filter;
            sfxCurrentPage = 0;
            allSfx = [];
            loadSfx();
        });
    });

    // Hide row if only "Todos" is present
    row.style.display = (subcats.length === 0) ? 'none' : 'flex';
}

// ─────────────────────────────────────────────────
// VIDEO FILTERS
// ─────────────────────────────────────────────────
function buildVideoFilters() {
    const cats = [...new Set(allVideos.map(v => v.collection || v.category || 'Geral'))].sort();
    buildGenericFilters(cats, applyFilters);
}
function buildMusicFilters() {
    // Now using buildMusicCategoryFilters from Supabase logic above
    buildMusicCategoryFilters();
}
function buildGenericFilters(cats, onApply) {
    const row = document.getElementById('filterRow');
    row.innerHTML = '<div class="filter-pill active" data-filter="all">Todos</div>';
    cats.slice(0, 30).forEach(cat => {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.dataset.filter = cat;
        pill.textContent = cat;
        row.appendChild(pill);
    });

    // Hide row if only "Todos" (meaning cats is empty or only 1 item)
    row.style.display = (cats.length <= 1) ? 'none' : 'flex';
    row.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            row.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.dataset.filter;
            onApply();
        });
    });
}

function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    if (currentTab === 'videos') {
        currentVideos = allVideos.filter(v => {
            const matchCat = activeFilter === 'all' || (v.collection || v.category || 'Geral') === activeFilter;
            const matchQ = !q || (v.title || v.name || '').toLowerCase().includes(q);
            return matchCat && matchQ;
        });
        renderVideos();
    } else if (currentTab === 'music') {
        currentMusic = allMusic.filter(m => {
            const matchCat = activeFilter === 'all' || (m.category || m.categoria || m.genre || 'Outros') === activeFilter;
            const matchQ = !q || (m.title || m.name || m.titulo || '').toLowerCase().includes(q) ||
                (m.artist || m.artista || '').toLowerCase().includes(q);
            return matchCat && matchQ;
        });
        renderMusic();
    }
}

// ─────────────────────────────────────────────────
// RENDER — VIDEOS
// ─────────────────────────────────────────────────
function renderVideos() {
    const area = document.getElementById('videosContent');
    if (!currentVideos.length) {
        area.innerHTML = '<div class="state-box"><div class="state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg></div><p>Nenhum vídeo encontrado.</p></div>';
        return;
    }
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    currentVideos.forEach(v => grid.appendChild(createVideoCard(v)));
    area.innerHTML = '';
    area.appendChild(grid);
}

function createVideoCard(v) {
    const url = v.video_url || v.url || v.videoUrl || v.cloudinaryUrl || v.link || '';
    const thumb = v.thumbnail_url || v.thumbnail || '';
    const title = v.title || v.name || v.titulo || 'Sem título';
    const cat = v.collection || v.category || 'Geral';

    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
    <div class="video-thumb">
      <video muted loop playsinline preload="metadata" poster="${thumb}"><source src="${url}" type="video/mp4"></video>
      <div class="play-overlay">⬇</div>
      <div class="import-flash">Importando...</div>
    </div>
    <div class="video-info">
      <div class="video-title">${title}</div>
      <div class="video-meta">${cat}</div>
    </div>`;
    const vid = card.querySelector('video');
    card.addEventListener('mouseenter', () => { vid.currentTime = 0; vid.play().catch(() => { }); });
    card.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
    card.addEventListener('click', () => importVideo(url, title));
    return card;
}

// ─────────────────────────────────────────────────
// RENDER — MUSIC
// ─────────────────────────────────────────────────
function renderMusic(hasMore = false) {
    const area = document.getElementById('musicContent');
    if (!allMusic.length && musicCurrentPage === 0) {
        area.innerHTML = '<div class="state-box"><div class="state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div><p>Nenhuma música encontrada.</p></div>';
        return;
    }

    if (musicCurrentPage === 0) {
        area.innerHTML = '';
    }

    let list = area.querySelector('.music-list');
    if (!list || musicCurrentPage === 0) {
        list = document.createElement('div');
        list.className = 'music-list';
        area.innerHTML = '';
        area.appendChild(list);
    }

    const startIdx = musicCurrentPage === 0 ? 0 : list.querySelectorAll('.music-card').length;
    currentMusic.slice(startIdx).forEach(m => list.appendChild(createMusicCard(m)));

    // Remove old load more button if exists
    const oldBtn = area.querySelector('.music-load-more');
    if (oldBtn) oldBtn.remove();

    if (hasMore) {
        const btn = document.createElement('button');
        btn.className = 'music-load-more sfx-load-more';
        const total = musicTotalCount || currentMusic.length;
        btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg> Carregar mais músicas (${currentMusic.length.toLocaleString('pt-BR')} / ${total.toLocaleString('pt-BR')})`;
        btn.addEventListener('click', () => {
            btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;margin:0"></div> Carregando...';
            btn.style.pointerEvents = 'none';
            loadMusic(musicCurrentPage + 1);
        });
        list.appendChild(btn);
    }
}

function createMusicCard(m) {
    const url = m.url || m.Cloud_R2_url || '';
    const title = m.titulo || m.title || m.name || 'Sem título';
    const artist = m.artista || m.artist || m.author || '';
    const cover = m.capa || m.cover || m.thumbnail || '';
    const cats = Array.isArray(m.categorias) ? m.categorias : [];
    const dur = m.duracao || 0;
    const peaks = m.picos || generateFakePeaks(title);
    const peaksArr = Array.isArray(peaks) ? peaks : generateFakePeaks(title);
    const durStr = dur > 0 ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` : '';

    const card = document.createElement('div');
    card.className = 'music-card sfx-style'; // Adding sfx-style class for layout

    const catBadges = cats.slice(0, 1).map(c => `<span class="music-tag-mini">${c}</span>`).join('');
    const waveHtml = peaksArr.map(h => `<div class="sfx-wave-bar" style="height:${Math.max(8, Math.min(100, h))}%"></div>`).join('');

    const playIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const pauseIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    const dlIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

    card.innerHTML = `
    <button class="music-play-btn">${playIconSvg}</button>
    <div class="music-cover-mini">
        ${cover ? `<img src="${cover}" alt="" onerror="this.style.display='none'">` : '<span style="font-size:10px;opacity:0.5">M</span>'}
    </div>
    <div class="music-info-mini">
      <div class="music-title-mini" title="${title}">${title}</div>
      <div class="music-artist-mini">${artist} ${catBadges}</div>
    </div>
    <div class="music-wave-wrap-mini sfx-wave-wrap">${waveHtml}</div>
    <div class="music-dur-mini">${durStr}</div>
    <button class="music-import-btn-mini sfx-import-btn" title="Importar">${dlIconSvg}</button>
    <audio src="${url}" preload="none"></audio>`;

    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.music-play-btn');
    const importBtn = card.querySelector('.music-import-btn-mini');
    const bars = card.querySelectorAll('.sfx-wave-bar');
    const waveWrap = card.querySelector('.music-wave-wrap-mini');

    audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) : 0;
        const progIdx = Math.floor(pct * bars.length);
        bars.forEach((b, i) => b.classList.toggle('played', i < progIdx));
    });

    audio.addEventListener('ended', () => {
        playBtn.innerHTML = playIconSvg; playBtn.classList.remove('playing');
        bars.forEach(b => b.classList.remove('played'));
        activeAudio = null; activePlayBtn = null;
    });

    const seek = (e) => {
        const rect = waveWrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (!audio.src) return;
        if (audio.paused) {
            toggleAudio(audio, playBtn);
        }
        if (audio.duration) audio.currentTime = pct * audio.duration;
    };
    waveWrap.addEventListener('click', seek);

    playBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isPlaying = playBtn.classList.contains('playing');
        toggleAudio(audio, playBtn);
        playBtn.innerHTML = isPlaying ? playIconSvg : pauseIconSvg;
    });

    importBtn.addEventListener('click', e => {
        e.stopPropagation();
        importAudio(url, title, importBtn);
    });

    return card;
}

// ─────────────────────────────────────────────────
// RENDER — SFX (matches site design)
// ─────────────────────────────────────────────────
function renderSfx(hasMore = false) {
    const area = document.getElementById('sfxContent');

    if (!currentSfx.length && sfxCurrentPage === 0) {
        area.innerHTML = '<div class="state-box"><div class="state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></div><p>Nenhum SFX encontrado.</p></div>';
        return;
    }

    const list = document.createElement('div');
    list.className = 'sfx-list';
    currentSfx.forEach(s => list.appendChild(createSfxCard(s)));

    // Handle initial render versus append
    if (sfxCurrentPage === 0) {
        area.innerHTML = '';
        area.appendChild(list);
    } else {
        const existingList = area.querySelector('.sfx-list');
        if (existingList) {
            currentSfx.forEach(s => existingList.appendChild(createSfxCard(s)));
        } else {
            area.appendChild(list);
        }
    }

    // Load more button logic
    const oldBtn = area.querySelector('.sfx-load-more');
    if (oldBtn) oldBtn.remove(); // Remove old button

    if (hasMore) {
        const btn = document.createElement('button');
        btn.className = 'sfx-load-more';
        const total = sfxTotalCount || currentSfx.length;
        const totalDisplayed = currentSfx.length; // More accurate than page math since we use append
        btn.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            Carregar mais (${totalDisplayed.toLocaleString('pt-BR')} / ${total.toLocaleString('pt-BR')})
        `;
        btn.addEventListener('click', () => {
            btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;margin:0"></div> Carregando...';
            btn.style.pointerEvents = 'none';
            sfxCurrentPage++;
            loadSfx(); // Uses append mode automatically
        });

        const targetList = area.querySelector('.sfx-list') || area;
        targetList.appendChild(btn);
    }
}

function createSfxCard(s) {
    const url = s.url || s.Cloud_R2_url || ''; // Ensure Cloud_R2_url is prioritized
    const title = s.titulo || 'Sem título';
    const tags = Array.isArray(s.categorias) ? s.categorias : (s.categoria ? [s.categoria] : []);
    const dur = s.duracao || 0;
    const peaks = s.picos || generateFakePeaks(title);
    const peaksArr = Array.isArray(peaks) ? peaks : generateFakePeaks(title);

    const card = document.createElement('div');
    card.className = 'sfx-card';

    const tagsHtml = tags.slice(0, 3).map(t => `<span class="sfx-tag">${t}</span>`).join('');
    const durStr = dur > 0 ? dur.toFixed(1) + 's' : '';
    const waveHtml = peaksArr.map(h => `<div class="sfx-wave-bar" style="height:${Math.max(8, Math.min(100, h))}%"></div>`).join('');

    const playIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const pauseIconSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><line x1="6" y1="4" x2="6" y2="20" stroke="currentColor" stroke-width="4"></line><line x1="18" y1="4" x2="18" y2="20" stroke="currentColor" stroke-width="4"></line></svg>`;
    const dlIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

    card.innerHTML = `
    <button class="sfx-play-btn">${playIconSvg}</button>
    <div class="sfx-info">
      <div class="sfx-title">${title}</div>
      <div class="sfx-tags">${tagsHtml}</div>
    </div>
    <div class="sfx-wave-wrap">${waveHtml}</div>
    <div class="sfx-right">
      <span class="sfx-dur">${durStr}</span>
      <button class="sfx-import-btn" title="Importar na timeline">${dlIconSvg}</button>
    </div>
    <audio></audio>`;

    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('.sfx-play-btn');
    const importBtn = card.querySelector('.sfx-import-btn');
    const waveBars = card.querySelectorAll('.sfx-wave-bar'); // DECLARED HERE - fixes waveform animation
    let audioLoaded = false;

    function loadAudio() {
        if (audioLoaded) return;
        audioLoaded = true;
        // Use the Cloudflare R2 URL directly for instant preview — no auth needed
        // driveId is only used for HQ download/import
        const src = url;
        if (src) {
            audio.src = src;
            audio.preload = 'metadata';
        } else {
            audioLoaded = false;
            showToast('SFX sem URL de preview', 'error');
        }
    }

    audio.addEventListener('loadedmetadata', () => {
        if (!dur && audio.duration) {
            card.querySelector('.sfx-dur').textContent = audio.duration.toFixed(1) + 's';
        }
    });

    // SEEK ON CLICK
    const waveWrap = card.querySelector('.sfx-wave-wrap');
    waveWrap.style.cursor = 'pointer';
    waveWrap.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!audio.src) loadAudio();

        const rect = waveWrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        if (audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = pct * audio.duration;
            if (audio.paused) {
                toggleAudio(audio, playBtn, playIconSvg, pauseIconSvg);
            }
        } else {
            // If metadata not loaded yet, wait and seek
            audio.addEventListener('loadedmetadata', () => {
                audio.currentTime = pct * audio.duration;
                toggleAudio(audio, playBtn, playIconSvg, pauseIconSvg);
            }, { once: true });
        }
    });

    // WAVEFORM ANIMATION - updates in real-time while audio plays
    let lastPct = -1;
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        const roundedPct = Math.floor(pct);

        if (roundedPct !== lastPct) {
            lastPct = roundedPct;
            waveBars.forEach((b, i) => {
                const barPct = (i / waveBars.length) * 100;
                b.classList.toggle('played', barPct <= pct);
            });
        }
    });

    audio.addEventListener('ended', () => {
        playBtn.innerHTML = playIconSvg;
        playBtn.classList.remove('playing');
        waveBars.forEach(b => b.classList.remove('played'));
        activeAudio = null;
        activePlayBtn = null;
    });

    audio.addEventListener('error', () => {
        audioLoaded = false;
        showToast('Erro ao carregar preview', 'error');
    });

    playBtn.addEventListener('click', e => {
        e.stopPropagation();
        loadAudio();
        toggleAudio(audio, playBtn, playIconSvg, pauseIconSvg);
    });

    importBtn.addEventListener('click', e => {
        e.stopPropagation();
        importAudio(url, title, importBtn);
    });

    return card;
}

// ─────────────────────────────────────────────────
// AUDIO CONTROLS
// ─────────────────────────────────────────────────
function toggleAudio(audio, playBtn, playIcon, pauseIcon) {
    if (activeAudio && activeAudio !== audio) stopAudio();
    if (audio.paused) {
        audio.play().catch(e => showToast('Erro: ' + e.message, 'error'));
        if (pauseIcon) playBtn.innerHTML = pauseIcon; else playBtn.textContent = '⏸';
        playBtn.classList.add('playing');
        activeAudio = audio; activePlayBtn = playBtn;
    } else {
        audio.pause();
        if (playIcon) playBtn.innerHTML = playIcon; else playBtn.textContent = '▶';
        playBtn.classList.remove('playing');
        activeAudio = null; activePlayBtn = null;
    }
}

function stopAudio() {
    if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; }
    if (activePlayBtn) { activePlayBtn.textContent = '▶'; activePlayBtn.classList.remove('playing'); }
    activeAudio = null; activePlayBtn = null;
}

// ─────────────────────────────────────────────────
// IMPORT INTO PREMIERE
// ─────────────────────────────────────────────────
function importVideo(url, title) {
    if (!url) { showToast('Vídeo sem URL', 'error'); return; }
    showToast('Importando vídeo...', 'info');
    csInterface.evalScript(`importVideoFromURL("${esc(url)}", "${esc(title)}")`, result => {
        if (!result || result === 'EvalScript error.') showToast('Erro: Premiere conectado?', 'error');
        else if (result.startsWith('ERROR:')) showToast(result.replace('ERROR:', '').trim(), 'error');
        else showToast('✓ ' + title.substring(0, 28) + ' importado!', 'success');
    });
}

async function importAudio(url, title, btn) {
    if (!url) { showToast('Arquivo sem URL de download', 'error'); return; }

    const isMusic = currentTab === 'music';
    const subFolder = isMusic ? 'Music' : 'SFX';

    if (btn) { btn.disabled = true; btn.style.opacity = '.4'; }
    showToast(`Baixando ${subFolder}...`, 'info');

    try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const libPath = path.join(os.homedir(), 'Documents', 'EditorMaster_Library', subFolder);
        if (!fs.existsSync(libPath)) { try { fs.mkdirSync(libPath, { recursive: true }); } catch (e) { } }

        let ext = '.mp3';
        if (url.toLowerCase().includes('.wav')) ext = '.wav';
        else if (url.toLowerCase().includes('.ogg')) ext = '.ogg';
        else if (url.toLowerCase().includes('.flac')) ext = '.flac';

        const safePrefix = isMusic ? 'MUSIC' : 'SFX';
        const safe = (title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || safePrefix).substring(0, 20);
        const finalPath = path.join(libPath, `${safe}_${Date.now()}${ext}`);

        await downloadFileNode(url, finalPath);

        const stats = fs.statSync(finalPath);
        if (stats.size < 1000) throw new Error('Arquivo baixado está vazio ou inválido');

        csInterface.evalScript(`importLocalAudio("${esc(finalPath)}", "${esc(title)}")`, result => {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            if (!result || result === 'EvalScript error.') {
                showToast('Erro no Premiere. Premiere está aberto com projeto?', 'error');
            } else if (result.startsWith('ERROR:')) {
                showToast(result.replace('ERROR:', '').trim().substring(0, 80), 'error');
            } else if (result.startsWith('SUCCESS_POOL:')) {
                showToast('No Media Pool (sem faixa de áudio na timeline)', 'info');
            } else {
                showToast(title.substring(0, 30) + ' na timeline!', 'success');
            }
        });

    } catch (err) {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        showToast('Erro: ' + (err.message || 'Falha no download').substring(0, 80), 'error');
    }
}

// Safe path escaping for Windows and Premiere Pro
function esc(s) {
    if (!s) return "";
    return s.toString()
        .replace(/\\/g, '\\\\')    // Escape backslashes for ExtendScript string literal
        .replace(/"/g, '\\"')      // Escape double quotes
        .replace(/'/g, "\\'");     // Escape single quotes
}

// ─────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────
function getActivePane() {
    if (currentTab === 'videos') return document.getElementById('videosContent');
    if (currentTab === 'music') return document.getElementById('musicContent');
    return document.getElementById('sfxContent');
}

function showLoading() {
    const pane = getActivePane();
    if (pane) pane.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Carregando...</p></div>`;
}

function showError(msg, retryFn) {
    const pane = getActivePane();
    if (!pane) return;
    pane.innerHTML = `<div class="state-box"><div class="state-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,107,138,0.5)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div><p>${msg}</p><button class="btn-retry" id="retryBtn">Tentar novamente</button></div>`;
    const btn = pane.querySelector('#retryBtn');
    if (btn) btn.addEventListener('click', retryFn);
}

let toastTimer;
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function fmtTime(s) {
    if (isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function generateFakePeaks(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i) * (i + 1);
    return Array.from({ length: 50 }, (_, i) => {
        const v = Math.abs(Math.sin((s + i * 0.8) * 0.3) * 30 + Math.sin((s + i * 1.4) * 0.7) * 25 + Math.abs(Math.sin((s + i) * 0.15)) * 20);
        return Math.max(8, Math.min(100, Math.round((v / 75) * 90) + 8));
    });
}
