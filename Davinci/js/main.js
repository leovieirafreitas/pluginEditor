const APP_VERSION = '1.2.0';

const API_BASE = 'https://biblioteca-de-cenas.onrender.com/api';
const API_DB_URL = 'https://apiserver.editlabpro.com.br/api/db';

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
// INIT & AUTHENTICATION
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('authOverlay');
    const authBtn = document.getElementById('authLoginBtn');
    const authEmail = document.getElementById('authEmail');
    const authPass = document.getElementById('authPassword');
    const authError = document.getElementById('authErrorMsg');

    const storedToken = localStorage.getItem('editlab_token');
    if (storedToken) {
        authOverlay.style.display = 'none';
        initApp();
    } else {
        authOverlay.style.display = 'flex';
    }

    authBtn.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        const pass = authPass.value;
        if (!email || !pass) {
            authError.textContent = 'Preencha todos os campos.';
            authError.style.display = 'block';
            return;
        }

        authBtn.textContent = 'Verificando...';
        authError.style.display = 'none';

        try {
            // Produção: API Hospedada no Easypanel
            const res = await fetch('https://apiserver.editlabpro.com.br/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Credenciais inválidas.');

            localStorage.setItem('editlab_token', data.token);
            authOverlay.style.opacity = '0';
            setTimeout(() => {
                authOverlay.style.display = 'none';
                initApp();
            }, 300);
        } catch (e) {
            authError.textContent = e.message;
            authError.style.display = 'block';
        } finally {
            authBtn.textContent = 'Entrar';
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('editlab_token');
            authOverlay.style.display = 'flex';
            authOverlay.style.opacity = '1';
        });
    }
});

function initApp() {
    setupEvents();
    buildSfxMainCatBar();
    buildMusicMainCatBar();
    populateClipYears();
    loadAll();
}

async function populateClipYears() {
    const sel = document.getElementById('clipcafeYear');
    if (!sel) return;

    sel.innerHTML = '<option value="">Todos os anos</option>';
    sel.addEventListener('change', () => fetchClipMovies(document.getElementById('searchInput').value, sel.value));

    try {
        // Busca anos diretamente da view_filmes_unicos pela API Node
        const res = await fetch(
            `${API_DB_URL}/view_filmes_unicos?select=ano&order=ano.desc`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('editlab_token')}`
                }
            }
        );
        if (!res.ok) return;
        const rows = await res.json();

        // Extrai anos únicos
        const years = [...new Set(rows.map(r => r.ano).filter(Boolean))]
            .sort((a, b) => String(b).localeCompare(String(a), undefined, { numeric: true }));

        let html = '<option value="">Todos os anos</option>';
        for (const y of years) html += `<option value="${y}">${y}</option>`;
        sel.innerHTML = html;
    } catch (e) {
        console.error('Erro ao buscar anos:', e);
    }
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
        searchTimer = setTimeout(triggerSearch, 800); // Aumentado para 800ms para evitar sobrecarga enquanto digita
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
    document.getElementById('legendasContent').style.display = (tab === 'legendas') ? 'block' : 'none';

    const sfxMainCatEl = document.getElementById('sfxMainCats');
    const musicMainCatEl = document.getElementById('musicMainCats');
    const legendasMainCatEl = document.getElementById('legendasMainCats');
    const sfxCountBar = document.getElementById('sfxCountBar');
    const musicCountBar = document.getElementById('musicCountBar');
    const legendasCountBar = document.getElementById('legendasCountBar');
    const filterRow = document.getElementById('filterRow');
    const globalSearch = document.querySelector('.search-bar');
    const selYear = document.getElementById('clipcafeYear');

    // Hide all category bars first
    sfxMainCatEl.style.display = 'none';
    musicMainCatEl.style.display = 'none';
    if (legendasMainCatEl) legendasMainCatEl.style.display = 'none';
    sfxCountBar.style.display = 'none';
    musicCountBar.style.display = 'none';
    if (legendasCountBar) legendasCountBar.style.display = 'none';
    filterRow.style.display = 'none';

    if (tab === 'legendas') {
        if (globalSearch) globalSearch.style.display = 'flex';
        if (selYear) selYear.style.display = 'none';
        if (legendasMainCatEl) legendasMainCatEl.style.display = 'block';
        if (legendasCountBar) legendasCountBar.style.display = 'block';
        loadCaptions();
        return;
    } else if (tab === 'sfx') {
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
    // Only load the current tab to prevent "Failed to fetch" on multiple simultaneous requests
    if (currentTab === 'videos') loadVideos();
    else if (currentTab === 'music') loadMusic();
    else if (currentTab === 'sfx') loadSfx();
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
// SUPABASE — CORTES DE FILMES
// ─────────────────────────────────────────────────
let clipMovies = [];
let clipSelectedMovie = null;
let clipSearchAbort = null;
const clipCache = new Map();
let CLIP_PAGE_SIZE = 12;

async function loadVideos() {
    renderClipCafe();
    fetchClipMovies('', '');
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

async function fetchClipMovies(query, year) {
    const body = document.getElementById('clipcafeBody');
    if (!body) { renderClipCafe(); return fetchClipMovies(query, year); }

    body.innerHTML = `<div class="state-box" style="margin-top:48px"><div class="spinner"></div><p>Buscando filmes...</p></div>`;

    if (clipSearchAbort) clipSearchAbort.abort();
    clipSearchAbort = new AbortController();

    const cacheKey = `${query}_${year}`;
    if (clipCache.has(cacheKey)) {
        displayClipMovies(clipCache.get(cacheKey));
        return;
    }

    try {
        // Busca filmes únicos da view_filmes_unicos via API Segura
        let url = `${API_DB_URL}/view_filmes_unicos?select=filme_slug,filme_nome,ano,capa_url&order=filme_nome.asc&limit=1000`;
        if (year) url += `&ano=eq.${encodeURIComponent(year)}`;
        if (query) url += `&filme_nome=ilike.*${encodeURIComponent(query)}*`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('editlab_token')}` },
            signal: clipSearchAbort.signal
        });
        if (!res.ok) throw new Error(`Erro Supabase ${res.status}`);
        const rows = await res.json();

        if (!rows.length) {
            body.innerHTML = `<div class="state-box" style="margin-top:48px"><p>Nenhum filme encontrado${query ? ` para "${query}"` : ''}</p></div>`;
            return;
        }

        // A view já retorna um filme por linha, sem duplicatas
        const movies = rows.map(r => ({
            slug: r.filme_slug,
            title: r.filme_nome,
            year: r.ano,
            poster: r.capa_url || '',
            clips: []
        })).sort((a, b) => String(b.year).localeCompare(String(a.year), undefined, { numeric: true }));

        clipCache.set(cacheKey, movies);
        displayClipMovies(movies);

    } catch (err) {
        if (err.name === 'AbortError') return;
        body.innerHTML = `<div class="state-box" style="margin-top:48px"><p>Erro: ${err.message}</p></div>`;
    }
}

function displayClipMovies(movies) {
    clipMovies = movies;
    document.getElementById('videoTabCount').textContent = movies.length;
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
            ${movie.poster && movie.poster !== 'null' ? `<img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.outerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:0.2\\'><svg width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'2\\' y=\\'2\\' width=\\'20\\' height=\\'20\\' rx=\\'2.18\\' ry=\\'2.18\\'></rect><line x1=\\'7\\' y1=\\'2\\' x2=\\'7\\' y2=\\'22\\'></line><line x1=\\'17\\' y1=\\'2\\' x2=\\'17\\' y2=\\'22\\'></line><line x1=\\'2\\' y1=\\'12\\' x2=\\'22\\' y2=\\'12\\'></line></svg></div>'"/>` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:0.2"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg></div>`}
            <div class="clip-movie-year">${movie.year}</div>
          </div>
          <div class="clip-movie-info">
            <div class="clip-movie-title">${movie.title}</div>
            <div class="clip-movie-count" id="count_${movie.slug}">— cenas</div>
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

    loadSceneCounts(clipMovies);
}

async function loadSceneCounts(movies) {
    if (!movies.length) return;
    const BATCH = 10;
    for (let i = 0; i < movies.length; i += BATCH) {
        if (movies !== clipMovies) return; // Fix: abort if search results changed
        const batch = movies.slice(i, i + BATCH);
        await Promise.all(batch.map(async (movie) => {
            // Se já buscou antes durante esta sessão (evita o plugin travar puxando infinitamente)
            if (movie.sceneCount !== undefined) {
                const el = document.getElementById('count_' + movie.slug);
                if (el) el.textContent = movie.sceneCount + ' cena' + (movie.sceneCount !== 1 ? 's' : '');
                return;
            }
            try {
                const qs = 'select=id&filme_slug=eq.' + encodeURIComponent(movie.slug) + '&limit=1';
                const res = await fetch(
                    API_DB_URL + '/filmes_cortes?' + qs,
                    {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('editlab_token'),
                            'Prefer': 'count=exact'
                        }
                    }
                );
                if (!res.ok) return;
                const range = res.headers.get('content-range');
                const total = range ? parseInt(range.split('/')[1]) : 0;

                // Salva no objeto pra usar de cache
                movie.sceneCount = total;

                const el = document.getElementById('count_' + movie.slug);
                if (el) el.textContent = total + ' cena' + (total !== 1 ? 's' : '');
            } catch (e) { }
        }));
    }
}

async function openClipMovie(movie) {
    // Usa variável LOCAL de cenas - nunca modifica o objeto do cache
    const currentSlug = movie.slug;
    clipSelectedMovie = { slug: currentSlug };

    // Reset do observer da sessão anterior para evitar memory leak
    if (window._sceneObserver) { window._sceneObserver.disconnect(); window._sceneObserver = undefined; }

    const area = document.getElementById('videosContent');
    const yearSel = document.getElementById('clipcafeYear');
    if (yearSel) yearSel.style.display = 'none';

    area.innerHTML = `
    <div id="clipcafeWrap" class="detail-mode">
      <div class="state-box" style="margin-top:100px"><div class="spinner"></div><p>Carregando cenas de ${movie.title}...</p></div>
    </div>`;

    // Variável LOCAL — completamente isolada do objeto de cache
    let localClips = [];

    try {
        const url = `${API_DB_URL}/filmes_cortes?select=cena_url,thumbnail_url&filme_slug=eq.${encodeURIComponent(currentSlug)}&limit=2000`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('editlab_token')}` }
        });
        // Race condition: usuário navegou para outro filme enquanto carregava
        if (clipSelectedMovie.slug !== currentSlug) return;

        if (res.ok) {
            const rows = await res.json();
            localClips = rows.map(r => ({
                downloadUrl: r.cena_url,
                thumbUrl: r.thumbnail_url || (r.cena_url ? r.cena_url.replace('.mp4', '.jpg') : '')
            }));
        }
    } catch (err) {
        console.error('Erro ao buscar cenas:', err);
    }

    // Verifica novamente se o usuário ainda está neste filme
    if (clipSelectedMovie.slug !== currentSlug) return;

    const posterSrc = movie.poster || '';

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
           <img src="${posterSrc}" class="clip-detail-poster-v2" onerror="this.style.opacity='0.3'"/>
        </div>
        <div class="clip-header-info">
           <div class="clip-detail-title-v2">${movie.title}</div>
           <div class="clip-detail-meta-v2">${movie.year} • <span id="clipDetailCount">${localClips.length}</span> cenas</div>
        </div>
      </div>
      <div id="clipDetailGrid" class="clip-detail-grid"></div>
      <div id="clipLoadMoreArea" class="load-more-container"></div>
    </div>`;

    renderClipGridPaginated(localClips, movie, 0);

    document.getElementById('clipBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clipSelectedMovie = null;
        const areaScrollBack = document.getElementById('contentArea');
        if (areaScrollBack) areaScrollBack.onscroll = null; // Fix: clear the scroll handler
        if (yearSel) yearSel.style.display = 'block';
        renderClipCafe();
        renderMovieGrid();
    });

    const areaScroll = document.getElementById('contentArea');
    let loadingMore = false;
    let currentPage = 0;
    areaScroll.onscroll = () => {
        if (!areaScroll) return;
        if (loadingMore) return;
        if (areaScroll.scrollTop + areaScroll.clientHeight >= areaScroll.scrollHeight - 100) {
            const total = localClips.length;
            if ((currentPage + 1) * CLIP_PAGE_SIZE < total) {
                loadingMore = true;
                currentPage++;
                const loadArea = document.getElementById('clipLoadMoreArea');
                if (loadArea) loadArea.innerHTML = '<div class="spinner" style="margin:10px auto"></div>';
                setTimeout(() => { renderClipGridPaginated(localClips, movie, currentPage); loadingMore = false; if (loadArea) loadArea.innerHTML = ''; }, 400);
            }
        }
    };
}


function renderClipGridPaginated(clips, movie, page) {
    // Fix: Race condition check. If we are no longer looking at this movie, abort rendering.
    if (!clipSelectedMovie || clipSelectedMovie.slug !== movie.slug) return;

    const grid = document.getElementById('clipDetailGrid');
    const loadMoreArea = document.getElementById('clipLoadMoreArea');
    if (!grid) return;

    if (page === 0) grid.innerHTML = '';

    const start = page * CLIP_PAGE_SIZE;
    const end = start + CLIP_PAGE_SIZE;
    const chunk = clips.slice(start, end);

    if (chunk.length === 0 && page === 0) {
        grid.innerHTML = '<div class="state-box" style="grid-column:span 3"><p>Nenhuma cena disponível.</p></div>';
        return;
    }

    // Staggered render: insere um card por frame para não travar a UI
    let i = 0;
    function renderNext() {
        // Race condition: usuário saiu do filme
        if (!clipSelectedMovie || clipSelectedMovie.slug !== movie.slug) return;
        if (i >= chunk.length) {
            // Todos os cards inseridos: atualiza o botão de carregar mais
            if (end < clips.length) {
                loadMoreArea.innerHTML = `<button class="clip-load-more-btn">Carregar mais cenas (${clips.length - end} restantes)</button>`;
                loadMoreArea.querySelector('button').onclick = () => {
                    loadMoreArea.innerHTML = '<div class="spinner" style="margin:10px auto"></div>';
                    setTimeout(() => renderClipGridPaginated(clips, movie, page + 1), 100);
                };
            } else {
                loadMoreArea.innerHTML = '';
            }
            return;
        }
        const c = chunk[i];
        const globalIndex = start + i + 1;
        i++;
        if (!c) { requestAnimationFrame(renderNext); return; }
        const finalDUrl = c.downloadUrl || '';
        const urlParts = finalDUrl.split('/');
        const fileName = urlParts[urlParts.length - 1] || '';
        const sceneSlug = fileName.replace('_HQ.mp4', '').replace(/-/g, ' ');

        const div = document.createElement('div');
        div.className = 'clip-scene-card';

        div.innerHTML = `
            <div class="clip-scene-thumb" style="position:relative; background:#111; overflow:hidden; cursor:pointer;">
                <img
                    class="scene-thumb-img"
                    src="${c.thumbUrl}"
                    onload="this.style.opacity='1'; const spin = this.parentElement.querySelector('.clip-scene-spinner'); if(spin) spin.style.display='none';"
                    onerror="this.style.opacity='0.2'; const spin = this.parentElement.querySelector('.clip-scene-spinner'); if(spin) spin.style.display='none';"
                    style="width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; opacity:0; transition: opacity 0.5s ease;"
                />
                <div class="clip-scene-spinner" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:2; pointer-events:none;">
                    <svg class="thumb-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" style="animation: spin 1s linear infinite;">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                </div>
                <div class="clip-scene-overlay" style="opacity:0; transition:opacity .2s; z-index:5; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.4);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="white" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7))"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
            </div>
            <div class="clip-scene-title" title="${sceneSlug}" style="opacity:0.8">${sceneSlug || 'Cena ' + globalIndex}</div>
            <button class="clip-scene-import">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Importar
            </button>`;

        const overlay = div.querySelector('.clip-scene-overlay');
        const thumb = div.querySelector('.clip-scene-thumb');

        if (!document.getElementById('spinnerAnimStyle')) {
            const style = document.createElement('style');
            style.id = 'spinnerAnimStyle';
            style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }

        // HOVER: apenas fade do icone de play. ZERO rede via video src.
        thumb.addEventListener('mouseenter', () => { if (overlay) overlay.style.opacity = '1'; });
        thumb.addEventListener('mouseleave', () => { if (overlay) overlay.style.opacity = '0'; });
        thumb.onclick = () => openClipPreviewLocal(finalDUrl, sceneSlug || movie.title);

        const btn = div.querySelector('.clip-scene-import');
        btn.onclick = (e) => { e.stopPropagation(); btn.disabled = true; btn.innerHTML = '<div class="spinner-small"></div> baixando...'; importClipCafeVideo(finalDUrl, sceneSlug || movie.title, btn); };

        grid.appendChild(div);
        requestAnimationFrame(renderNext); // Próximo card no próximo frame
    }
    requestAnimationFrame(renderNext); // Inicia a cadeia
}

// ─────────────────────────────────────────────────
// CLIP PREVIEW — streaming direto do R2
// ─────────────────────────────────────────────────
async function openClipPreviewLocal(videoUrl, title) {
    if (!videoUrl) { showToast('Sem URL de preview', 'error'); return; }

    const existing = document.getElementById('clipPreviewModal');
    if (existing) { const ov = existing.querySelector('video'); if (ov) { ov.pause(); ov.src = ''; } existing.remove(); }

    const modal = document.createElement('div');
    modal.id = 'clipPreviewModal';
    modal.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.93); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px;';

    const cleanTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    modal.innerHTML = `
        <div id="clipPreviewBox" style="width:100%; max-width:680px; background:#0f0f0f; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); box-shadow:0 24px 80px rgba(0,0,0,0.9);">
            <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.07); background:#141414;">
                <span style="font-size:10px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80%;">${cleanTitle}</span>
                <button id="clipPreviewClose" style="background:rgba(255,60,60,0.15); border:1px solid rgba(255,60,60,0.25); color:#ff6b6b; border-radius:6px; padding:4px 12px; cursor:pointer; font-size:10px; font-weight:800;">✕ FECHAR</button>
            </div>
            <div id="clipPreviewContent" style="width:100%; background:#000; min-height:220px; display:flex; align-items:center; justify-content:center; position:relative;">
                <div id="clipPreviewSpinner" class="spinner" style="position:absolute; z-index:10;"></div>
                <video id="clipPreviewVideo" src="${videoUrl}" controls autoplay preload="metadata" style="width:100%; height:auto; display:block; max-height:70vh; z-index:20; position:relative;"></video>
            </div>
        </div>
    `;

    const videoElement = modal.querySelector('#clipPreviewVideo');
    const spinnerElement = modal.querySelector('#clipPreviewSpinner');

    if (spinnerElement) spinnerElement.style.display = 'block';
    if (videoElement) {
        videoElement.onplaying = () => { if (spinnerElement) spinnerElement.style.display = 'none'; };
        videoElement.onerror = () => {
            if (spinnerElement) spinnerElement.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px; padding:30px; color:#ff6b6b; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em;';
            errorDiv.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Erro ao carregar preview
            `;
            const contentDiv = document.getElementById('clipPreviewContent');
            if (contentDiv) {
                contentDiv.appendChild(errorDiv);
                videoElement.style.display = 'none';
            }
        };
    }

    function closePreviewModal() {
        const m = document.getElementById('clipPreviewModal');
        if (m) { const v = m.querySelector('video'); if (v) { v.pause(); v.src = ''; } m.remove(); }
    }

    modal.addEventListener('click', (e) => { if (e.target === modal) closePreviewModal(); });
    modal.querySelector('#clipPreviewClose').addEventListener('click', closePreviewModal);
    document.addEventListener('keydown', function escClose(e) { if (e.key === 'Escape') { closePreviewModal(); document.removeEventListener('keydown', escClose); } });
    document.body.appendChild(modal);
}

async function downloadFileNode(url, dest, _attempt) {
    const attempt = _attempt || 1;
    const MAX_ATTEMPTS = 5;
    const fs = window.require ? window.require('fs') : require('fs');
    const https = window.require ? window.require('https') : require('https');
    const http = window.require ? window.require('http') : require('http');
    const { URL } = window.require ? window.require('url') : require('url');

    return new Promise((resolve, reject) => {
        let isDone = false;
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            timeout: 30000
        };

        if (attempt === 1 && fs.existsSync(dest)) {
            try { fs.unlinkSync(dest); } catch (e) { }
        }

        const req = protocol.get(url, options, (res) => {
            if (isDone) return;

            if ([301, 302, 307, 308].includes(res.statusCode)) {
                res.resume();
                const nextUrl = res.headers.location;
                if (!nextUrl || attempt >= MAX_ATTEMPTS) {
                    isDone = true;
                    reject(new Error(attempt >= MAX_ATTEMPTS ? 'Excesso de redirecionamentos' : 'URL de redirecionamento inválida'));
                    return;
                }
                downloadFileNode(nextUrl, dest, attempt + 1).then(resolve).catch(reject);
                isDone = true;
                return;
            }

            if (res.statusCode !== 200) {
                res.resume();
                isDone = true;
                reject(new Error(`Erro HTTP ${res.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);

            let lastDataTime = Date.now();
            const watchdog = setInterval(() => {
                if (Date.now() - lastDataTime > 20000) {
                    isDone = true;
                    clearInterval(watchdog);
                    req.destroy();
                    fileStream.destroy();
                    if (attempt < MAX_ATTEMPTS) {
                        console.log('[Download] Inativo. Reiniciando...');
                        downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject);
                    } else {
                        reject(new Error('Download cancelado por inatividade'));
                    }
                }
            }, 5000);

            res.on('data', () => { lastDataTime = Date.now(); });

            fileStream.on('finish', () => { fileStream.close(); });
            fileStream.on('close', () => {
                if (isDone) return;
                isDone = true;
                clearInterval(watchdog);
                resolve();
            });

            const handleError = (err) => {
                if (isDone) return;
                isDone = true;
                clearInterval(watchdog);
                fileStream.destroy();
                if (attempt < MAX_ATTEMPTS) {
                    setTimeout(() => downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject), 1500);
                } else {
                    reject(err);
                }
            };

            res.on('error', handleError);
            fileStream.on('error', handleError);
        });

        req.on('error', (err) => {
            if (isDone) return;
            isDone = true;
            if (attempt < MAX_ATTEMPTS) {
                setTimeout(() => downloadFileNode(url, dest, attempt + 1).then(resolve).catch(reject), 1500);
            } else {
                reject(err);
            }
        });

        req.setTimeout(40000, () => {
            req.destroy();
        });
    });
}

async function importClipCafeVideo(videoUrl, title, btn) {
    if (!videoUrl) { showToast('Cena sem URL', 'error'); return; }
    showToast('⬇ Baixando cena...', 'info');

    try {
        const fs = window.require ? window.require('fs') : require('fs');
        const path = window.require ? window.require('path') : require('path');
        const os = window.require ? window.require('os') : require('os');

        const libPath = path.join(os.homedir(), 'Documents', 'EditLabPro_Library', 'Filmes');
        if (!fs.existsSync(libPath)) { try { fs.mkdirSync(libPath, { recursive: true }); } catch (e) { } }

        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const randomId = Math.random().toString(36).substring(2, 7);
        const finalPath = path.join(libPath, `${safeTitle}_${Date.now()}_${randomId}.mp4`);

        await downloadFileNode(videoUrl, finalPath);

        const stats = fs.statSync(finalPath);
        if (stats.size < 1000) throw new Error('Arquivo baixado está vazio ou inválido');

        const result = await window.resolveAPI.importMedia(finalPath);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar';
        }
        if (!result) {
            showToast('Erro interno DaVinci: sem resposta', 'error');
        } else if (result.startsWith('ERROR:')) {
            showToast(result.replace('ERROR:', '').trim(), 'error');
        } else if (result.includes('SUCCESS:')) {
            if (result.includes('Media Pool')) showToast('✓ ' + title.substring(0, 28) + ' no Media Pool!', 'info');
            else showToast('✓ ' + title.substring(0, 28) + ' na timeline!', 'success');
        } else {
            showToast(result, 'info');
        }

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
        let url = `${API_DB_URL}/music_library?select=id,titulo,artista,categorias,duracao,capa,picos,Cloud_R2_url&limit=${limit}&offset=${offset}`;
        if (q) url += `&or=(titulo.ilike.*${encodeURIComponent(q)}*,artista.ilike.*${encodeURIComponent(q)}*)`;
        if (musicActiveCategory && musicActiveCategory !== 'all') {
            url += `&categorias=cs.${encodeURIComponent('["' + musicActiveCategory + '"]')}`;
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('editlab_token')}`,
                'Accept': 'application/json',
                'Prefer': 'count=exact'
            }
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`API erro ${res.status}: ${errBody.substring(0, 50)}`);
        }

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
        // Base URL seguro via API Node
        let url = `${API_DB_URL}/sfx_library?select=id,titulo,categorias,Cloud_R2_url,google_drive_id,duracao,picos&limit=${limit}&offset=${offset}`;

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
                'Authorization': `Bearer ${localStorage.getItem('editlab_token')}`,
                'Accept': 'application/json',
                'Prefer': 'count=exact'
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API erro ${res.status}: ${errText.substring(0, 80)}`);
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
            const matchCat = musicActiveCategory === 'all' ||
                (m.categorias && Array.isArray(m.categorias) && m.categorias.includes(musicActiveCategory)) ||
                (m.category || m.categoria || m.genre || 'Outros') === musicActiveCategory;
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
                <div class="video-thumb" >
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

function formatDuration(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatTimeProgress(curr, dur) {
    if (!dur || isNaN(dur)) return '0:00';
    return `${formatDuration(curr)} / ${formatDuration(dur)}`;
}

function createMusicCard(m) {
    let url = m.url || m.Cloud_R2_url || '';
    if (url && !url.startsWith('http')) url = 'https://' + url;
    const title = m.titulo || m.title || m.name || 'Sem título';
    const artist = m.artista || m.artist || m.author || '';
    const cover = m.capa || m.cover || m.thumbnail || '';
    const cats = Array.isArray(m.categorias) ? m.categorias : [];
    const dur = m.duracao || 0;
    const peaks = m.picos || generateFakePeaks(title);
    const peaksArr = Array.isArray(peaks) ? peaks : generateFakePeaks(title);
    const durStr = formatDuration(dur);

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
        ${cover ? `<img src="${cover}" alt="" loading="lazy" onerror="this.outerHTML='<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.2)\' stroke-width=\'1.5\'><path d=\'M9 18V5l12-2v13\'></path><circle cx=\'6\' cy=\'18\' r=\'3\'></circle><circle cx=\'18\' cy=\'16\' r=\'3\'></circle></svg>'">` : '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'}
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

    const durEl = card.querySelector('.music-dur-mini');

    audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) : 0;
        const progIdx = Math.floor(pct * bars.length);
        bars.forEach((b, i) => b.classList.toggle('played', i < progIdx));
        if (audio.duration && durEl) durEl.textContent = formatTimeProgress(audio.currentTime, audio.duration);
        bars.forEach((b, i) => b.classList.toggle('played', i < progIdx));
    });

    audio.addEventListener('ended', () => {
        playBtn.innerHTML = playIconSvg; playBtn.classList.remove('playing');
        if (durEl) durEl.textContent = formatDuration(dur);
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
    let url = s.url || s.Cloud_R2_url || ''; // Ensure Cloud_R2_url is prioritized
    if (url && !url.startsWith('http')) url = 'https://' + url;
    const title = s.titulo || 'Sem título';
    const tags = Array.isArray(s.categorias) ? s.categorias : (s.categoria ? [s.categoria] : []);
    const dur = s.duracao || 0;
    const peaks = s.picos || generateFakePeaks(title);
    const peaksArr = Array.isArray(peaks) ? peaks : generateFakePeaks(title);

    const card = document.createElement('div');
    card.className = 'sfx-card';

    const tagsHtml = tags.slice(0, 3).map(t => `<span class="sfx-tag">${t}</span>`).join('');
    const durStr = formatDuration(dur);
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
        // We will update time during playback instead
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
    const durEl = card.querySelector('.sfx-dur');
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        const roundedPct = Math.floor(pct);

        if (durEl) durEl.textContent = formatTimeProgress(audio.currentTime, audio.duration);

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
        if (durEl) durEl.textContent = formatDuration(dur);
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
        audio.play().catch(e => {
            if (e.name !== 'AbortError') showToast('Erro: ' + e.message, 'error');
        });
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
async function importVideo(url, title) {
    if (!url) { showToast('Vídeo sem URL', 'error'); return; }
    showToast('Importando vídeo...', 'info');
    try {
        const fs = window.require('fs');
        const path = window.require('path');
        const os = window.require('os');
        const libPath = path.join(os.homedir(), 'Documents', 'EditLabPro_Library', 'Filmes');
        if (!fs.existsSync(libPath)) { try { fs.mkdirSync(libPath, { recursive: true }); } catch (e) { } }
        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const finalPath = path.join(libPath, `${safeTitle}_${Date.now()}.mp4`);
        await downloadFileNode(url, finalPath);

        const result = await window.resolveAPI.importMedia(finalPath);
        if (!result) showToast('Erro no DaVinci. DaVinci conectado?', 'error');
        else if (result.startsWith('ERROR:')) showToast(result.replace('ERROR:', '').trim(), 'error');
        else showToast('✓ ' + title.substring(0, 28) + ' importado!', 'success');
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    }
}

async function importAudio(url, title, btn) {
    if (!url) { showToast('Arquivo sem URL de download', 'error'); return; }

    const isMusic = currentTab === 'music';
    const subFolder = isMusic ? 'Music' : 'SFX';

    if (btn) { btn.disabled = true; btn.style.opacity = '.4'; }
    showToast(`Baixando ${subFolder}...`, 'info');

    try {
        const fs = window.require('fs');
        const path = window.require('path');
        const os = window.require('os');

        const libPath = path.join(os.homedir(), 'Documents', 'EditLabPro_Library', subFolder);
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

        const result = await window.resolveAPI.importMedia(finalPath);
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        if (!result) {
            showToast('Erro no DaVinci. DaVinci está aberto com projeto?', 'error');
        } else if (result.startsWith('ERROR:')) {
            showToast(result.replace('ERROR:', '').trim().substring(0, 80), 'error');
        } else if (result.includes('Media Pool')) {
            showToast('No Media Pool (sem faixa ativa na timeline)', 'info');
        } else {
            showToast(title.substring(0, 30) + ' na timeline!', 'success');
        }

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
    if (btn) btn.addEventListener('click', () => { if (retryFn) retryFn(); });
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
    return `${Math.floor(s / 60)}: ${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function generateFakePeaks(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i) * (i + 1);
    return Array.from({ length: 50 }, (_, i) => {
        const v = Math.abs(Math.sin((s + i * 0.8) * 0.3) * 30 + Math.sin((s + i * 1.4) * 0.7) * 25 + Math.abs(Math.sin((s + i) * 0.15)) * 20);
        return Math.max(8, Math.min(100, Math.round((v / 75) * 90) + 8));
    });
}

// ─────────────────────────────────────────────────
// LEGENDAS — CAPTIONS VIRAIS
// ─────────────────────────────────────────────────
let captionsLoaded = false;
let captionsData = [];

async function loadCaptions() {
    if (captionsLoaded) return;
    const grid = document.getElementById('captionGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="state-box"><div class="spinner"></div><p>Carregando legendas...</p></div>';
    try {
        const jsonPath = window.nodeAPI.path.join(__dirname, 'Legendas', 'captions_virais.json');
        const dataStr = window.nodeAPI.fs.readFileSync(jsonPath, 'utf8');
        captionsData = JSON.parse(dataStr);
        captionsLoaded = true;
        buildLegendasMainCatBar();
        renderCaptions();
        const countSpan = document.getElementById('captionCountNum');
        if (countSpan) countSpan.textContent = captionsData.length;
    } catch (e) {
        grid.innerHTML = '<div class="state-box"><p style="color:#ff6b8a">Erro ao carregar legendas. Verifique a instalação.</p></div>';
        console.error('Erro loadCaptions:', e);
    }
}

function buildLegendasMainCatBar() {
    const tabs = document.querySelectorAll('#legendasMainCats .sfx-main-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Como por enquanto só temos 'Captions Virais', não filtramos
            // No futuro: activeLegendasCat = tab.dataset.cat;
        });
    });
}

function renderCaptions() {
    const grid = document.getElementById('captionGrid');
    if (!grid) return;
    if (!captionsData.length) {
        grid.innerHTML = '<div class="state-box"><p>Nenhuma legenda encontrada.</p></div>';
        return;
    }
    grid.innerHTML = captionsData.map(cap => `
        <div class="caption-card">
            <img class="caption-gif" src="${cap.gif_url}" alt="${cap.name}" loading="lazy"
                 onerror="this.style.background='#1a1a2e';this.alt='Preview indisponível';">
            <div class="caption-info">
                <div class="caption-name">${cap.name}</div>
                <button class="caption-apply-btn" onclick="applyCaption(${cap.id}, this)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Importar
                </button>
            </div>
        </div>
    `).join('');
}

async function applyCaption(captionId, btn) {
    const cap = captionsData.find(c => c.id === captionId);
    if (!cap) return;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:10px;height:10px;border-width:2px;"></div> Importando...';

    try {
        // Build path to the .setting file inside the plugin folder
        const pluginBase = window.nodeAPI.path.join(
            'C:\\ProgramData', 'Blackmagic Design', 'DaVinci Resolve',
            'Support', 'Workflow Integration Plugins', 'com.editormaster.premium.v1',
            'Legendas', 'CaptionsVirais'
        );
        // Mac path fallback
        const homeDir = window.nodeAPI.os.homedir();
        const macBase = window.nodeAPI.path.join(
            homeDir, 'Library', 'Application Support',
            'Blackmagic Design', 'DaVinci Resolve',
            'Workflow Integration Plugins', 'com.editormaster.premium.v1',
            'Legendas', 'CaptionsVirais'
        );
        const base = window.nodeAPI.fs.existsSync(pluginBase) ? pluginBase : macBase;
        const presetPath = window.nodeAPI.path.join(base, cap.preset_file);

        const result = await window.resolveAPI.applyCaption(presetPath);
        if (result && result.startsWith('SUCCESS')) {
            const msg = result.replace('SUCCESS:', '').trim();
            btn.innerHTML = '✅ Adicionado!';
            showToast(`✅ "${cap.name}" ${msg}`, 'success');
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar';
            }, 4000);
        } else {
            throw new Error(result || 'Erro desconhecido');
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = '⚠️ Tentar novamente';
        showToast('Erro ao instalar preset: ' + e.message, 'error');
    }
}

