const fs = require('fs');
const c = fs.readFileSync('Davinci/js/main.js', 'utf8');

const start = c.indexOf('async function loadSceneCounts');
const end = c.indexOf('\r\nasync function openClipMovie');

const newFn = `async function loadSceneCounts(movies) {
    if (!movies.length) return;
    const BATCH = 10;
    for (let i = 0; i < movies.length; i += BATCH) {
        const batch = movies.slice(i, i + BATCH);
        await Promise.all(batch.map(async (movie) => {
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
                const el = document.getElementById('count_' + movie.slug);
                if (el) el.textContent = total + ' cena' + (total !== 1 ? 's' : '');
            } catch (e) { }
        }));
    }
}
`;

const result = c.substring(0, start) + newFn + c.substring(end);
fs.writeFileSync('Davinci/js/main.js', result, 'utf8');
console.log('done', start, end);
