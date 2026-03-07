const fs = require('fs');
const PREM = 'Premiere/com.editormaster.premium.v1/js/main.js';
let c = fs.readFileSync(PREM, 'utf8');

// Fix 1: populateClipYears - swap RPC for view
const rpcIdx = c.indexOf('rest/v1/rpc/get_anos_distintos');
if (rpcIdx !== -1) {
    // Find start of fetch call (going back to find "const res = await fetch(")
    const fetchStart = c.lastIndexOf('const res = await fetch(', rpcIdx);
    // Find end: closing paren of fetch + semicolon pattern
    const afterRpc = c.indexOf("body: '{}'", rpcIdx) + "body: '{}'".length;
    const fetchEnd = c.indexOf('\r\n        );', afterRpc) + '\r\n        );'.length;

    const newFetch = `const res = await fetch(
            \`\${SUPABASE_URL}/rest/v1/view_filmes_unicos?select=ano&order=ano.desc\`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': \`Bearer \${SUPABASE_KEY}\`
                }
            }
        );`;

    c = c.substring(0, fetchStart) + newFetch + c.substring(fetchEnd);
    console.log('✓ populateClipYears RPC replaced with view');
} else {
    console.log('✗ RPC not found');
}

// Fix 2: fetchClipMovies - swap filmes_cortes for view_filmes_unicos
const fc1 = c.indexOf('filmes_cortes?select=filme_nome');
if (fc1 !== -1) {
    c = c.replace(
        'filmes_cortes?select=filme_nome,filme_slug,capa_url,ano',
        'view_filmes_unicos?select=filme_nome,filme_slug,capa_url,ano'
    );
    // Remove limit=5000, keep order
    c = c.replace('&order=ano.desc,filme_nome.asc&limit=5000', '&order=ano.desc,filme_nome.asc&limit=1000');
    console.log('✓ fetchClipMovies url fixed');
} else {
    console.log('✗ filmes_cortes?select=filme_nome not found');
}

// Fix 3: Remove old grouping code after rows = await res.json() in fetchClipMovies
// Replace movieMap grouping with simple .map()
const OLD_GROUP = `        // Agrupar rows por slug para montar lista de filmes únicos
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

const NEW_GROUP = `        // A view já retorna um filme por linha, sem duplicatas
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

if (c.includes(OLD_GROUP)) {
    c = c.replace(OLD_GROUP, NEW_GROUP);
    console.log('✓ movieMap grouping removed');
} else {
    console.log('✗ OLD_GROUP not found');
}

fs.writeFileSync(PREM, c, 'utf8');
console.log('Done! File size:', c.length);
