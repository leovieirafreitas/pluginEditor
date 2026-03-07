const fs = require('fs');
const PREM = 'Premiere/com.editormaster.premium.v1/js/main.js';
let c = fs.readFileSync(PREM, 'utf8');

// 1. Fix populateClipYears - usar view_filmes_unicos em vez de RPC
const OLD_YEARS = `    try {
        // Chama a função SQL que retorna apenas os anos distintos
        const res = await fetch(
            \`\${SUPABASE_URL}/rest/v1/rpc/get_anos_distintos\`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': \`Bearer \${SUPABASE_KEY}\`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            }
        );`;

const NEW_YEARS = `    try {
        // Busca anos diretamente da view_filmes_unicos
        const res = await fetch(
            \`\${SUPABASE_URL}/rest/v1/view_filmes_unicos?select=ano&order=ano.desc\`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': \`Bearer \${SUPABASE_KEY}\`
                }
            }
        );`;

if (c.includes(OLD_YEARS)) {
    c = c.replace(OLD_YEARS, NEW_YEARS);
    console.log('✓ populateClipYears fixed');
} else {
    console.log('✗ populateClipYears NOT found - manual check needed');
}

// Fix the years parsing too (rows.map(r => r.ano) might need Set)
const OLD_YEARS_PARSE = `        const years = rows.map(r => r.ano).filter(Boolean)`;
const NEW_YEARS_PARSE = `        const years = [...new Set(rows.map(r => r.ano).filter(Boolean))]`;
if (c.includes(OLD_YEARS_PARSE)) {
    c = c.replace(OLD_YEARS_PARSE, NEW_YEARS_PARSE);
    console.log('✓ years parse fixed');
}

// 2. Fix fetchClipMovies - usar view_filmes_unicos em vez de filmes_cortes (com limit=5000)
const OLD_FETCH = `        // Busca filmes distintos da tabela filmes_cortes no Supabase
        let url = \`\${SUPABASE_URL}/rest/v1/filmes_cortes?select=filme_nome,filme_slug,capa_url,ano\`;
        if (query && query.length > 1) {
            url += \`&filme_nome=ilike.*\${encodeURIComponent(query)}*\`;
        }
        if (year && year !== '') {
            url += \`&ano=eq.\${year}\`;
        }
        url += \`&order=ano.desc,filme_nome.asc&limit=5000\`;

        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': \`Bearer \${SUPABASE_KEY}\`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(\`Erro \${res.status}\`);
        const rows = await res.json();

        // Agrupar rows por slug para montar lista de filmes únicos
        const movieMap = {};
        for (const row of rows) {
            if (!movieMap[row.filme_slug]) {
                movieMap[row.filme_slug] = {
                    title: row.filme_nome,
                    slug: row.filme_slug,
                    year: row.ano,
                    poster: row.capa_url || '',
                    clips: []
                };
            }
        }

        const movies = Object.values(movieMap).sort((a, b) => {
            if (b.year !== a.year) return (b.year || '0').localeCompare(a.year || '0');
            return a.title.localeCompare(b.title);
        });`;

const NEW_FETCH = `        // Busca filmes únicos da view_filmes_unicos (já agrupados, sem duplicatas)
        let url = \`\${SUPABASE_URL}/rest/v1/view_filmes_unicos?select=filme_nome,filme_slug,capa_url,ano&order=ano.desc,filme_nome.asc&limit=1000\`;
        if (query && query.length > 1) {
            url += \`&filme_nome=ilike.*\${encodeURIComponent(query)}*\`;
        }
        if (year && year !== '') {
            url += \`&ano=eq.\${year}\`;
        }

        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': \`Bearer \${SUPABASE_KEY}\`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(\`Erro \${res.status}\`);
        const rows = await res.json();

        // A view já retorna um filme por linha, sem duplicatas
        const movies = rows.map(row => ({
            title: row.filme_nome,
            slug: row.filme_slug,
            year: row.ano,
            poster: row.capa_url || '',
            clips: []
        })).sort((a, b) => {
            if (b.year !== a.year) return (b.year || '0').localeCompare(a.year || '0');
            return a.title.localeCompare(b.title);
        });`;

if (c.includes(OLD_FETCH)) {
    c = c.replace(OLD_FETCH, NEW_FETCH);
    console.log('✓ fetchClipMovies fixed');
} else {
    console.log('✗ fetchClipMovies NOT found - partial match check:');
    console.log('  has filmes_cortes?select:', c.includes('filmes_cortes?select=filme_nome'));
}

// 3. Fix loadSceneCounts - usar count=exact em vez de baixar tudo
const OLD_COUNTS_START = 'async function loadSceneCounts(movies) {';
const OLD_COUNTS_END = '\r\nasync function openClipMovie';
const startIdx = c.indexOf(OLD_COUNTS_START);
const endIdx = c.indexOf(OLD_COUNTS_END);

if (startIdx !== -1 && endIdx !== -1) {
    const NEW_COUNTS = `async function loadSceneCounts(movies) {
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
    c = c.substring(0, startIdx) + NEW_COUNTS + c.substring(endIdx);
    console.log('✓ loadSceneCounts fixed');
} else {
    console.log('✗ loadSceneCounts NOT found:', startIdx, endIdx);
}

fs.writeFileSync(PREM, c, 'utf8');
console.log('Done! File size:', c.length);
