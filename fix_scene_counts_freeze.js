const fs = require('fs');

function fixLoadSceneCounts(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    const startIdx = c.indexOf('async function loadSceneCounts');
    if (startIdx === -1) {
        console.log('Not found in', filePath);
        return;
    }
    const endIdx = c.indexOf('\n}', c.indexOf('for (let i = 0', startIdx)) + 2;
    console.log('Replacing loadSceneCounts in', filePath);

    const newFunc = `async function loadSceneCounts(movies) {
    if (!movies.length) return;
    const BATCH = 10;
    for (let i = 0; i < movies.length; i += BATCH) {
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
                    SUPABASE_URL + '/rest/v1/filmes_cortes?' + qs,
                    {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_KEY,
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
}`;

    // Replace the old function
    c = c.substring(0, startIdx) + newFunc + c.substring(endIdx);
    fs.writeFileSync(filePath, c, 'utf8');
}

fixLoadSceneCounts('Davinci/js/main.js');
fixLoadSceneCounts('Premiere/com.editormaster.premium.v1/js/main.js');
