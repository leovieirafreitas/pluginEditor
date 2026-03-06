const fs = require('fs');

function fixOpenClipMovieFinal(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    const startMarker = 'async function openClipMovie(movie) {';
    const endMarker = '\r\nfunction renderClipGridPaginated';
    const endMarker2 = '\nasync function renderClipGridPaginated';

    const startIdx = c.indexOf(startMarker);
    let endIdx = c.indexOf(endMarker, startIdx);
    if (endIdx === -1) endIdx = c.indexOf(endMarker2, startIdx);

    console.log('Replacing openClipMovie:', startIdx, endIdx);

    const newFunc = `async function openClipMovie(movie) {
    // Usa variável LOCAL de cenas - nunca modifica o objeto do cache
    const currentSlug = movie.slug;
    clipSelectedMovie = { slug: currentSlug };
    const area = document.getElementById('videosContent');
    const yearSel = document.getElementById('clipcafeYear');
    if (yearSel) yearSel.style.display = 'none';

    area.innerHTML = \`
    <div id="clipcafeWrap" class="detail-mode">
      <div class="state-box" style="margin-top:100px"><div class="spinner"></div><p>Carregando cenas de \${movie.title}...</p></div>
    </div>\`;

    // Variável LOCAL — completamente isolada do objeto de cache
    let localClips = [];

    try {
        const url = \`\${SUPABASE_URL}/rest/v1/filmes_cortes?select=cena_url&filme_slug=eq.\${encodeURIComponent(currentSlug)}&limit=2000\`;
        const res = await fetch(url, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': \`Bearer \${SUPABASE_KEY}\` }
        });
        // Race condition: usuário navegou para outro filme enquanto carregava
        if (clipSelectedMovie.slug !== currentSlug) return;
        
        if (res.ok) {
            const rows = await res.json();
            localClips = rows.map(r => ({ downloadUrl: r.cena_url }));
        }
    } catch (err) {
        console.error('Erro ao buscar cenas:', err);
    }

    // Verifica novamente se o usuário ainda está neste filme
    if (clipSelectedMovie.slug !== currentSlug) return;

    const posterSrc = movie.poster || '';

    area.innerHTML = \`
    <div id="clipcafeWrap" class="detail-mode">
      <div class="clip-top-nav">
        <button class="clip-back-btn-v2" id="clipBackBtn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Voltar
        </button>
      </div>
      <div class="clip-detail-header-v2">
        <div class="clip-poster-container">
           <img src="\${posterSrc}" class="clip-detail-poster-v2" onerror="this.style.opacity='0.3'"/>
        </div>
        <div class="clip-header-info">
           <div class="clip-detail-title-v2">\${movie.title}</div>
           <div class="clip-detail-meta-v2">\${movie.year} • <span id="clipDetailCount">\${localClips.length}</span> cenas</div>
        </div>
      </div>
      <div id="clipDetailGrid" class="clip-detail-grid"></div>
      <div id="clipLoadMoreArea" class="load-more-container"></div>
    </div>\`;

    renderClipGridPaginated(localClips, movie, 0);

    document.getElementById('clipBackBtn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clipSelectedMovie = null;
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

`;

    c = c.substring(0, startIdx) + newFunc + c.substring(endIdx);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('✓ Fixed:', filePath, 'size:', c.length);
}

fixOpenClipMovieFinal('Davinci/js/main.js');
fixOpenClipMovieFinal('Premiere/com.editormaster.premium.v1/js/main.js');
