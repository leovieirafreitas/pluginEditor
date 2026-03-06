const fs = require('fs');

function fixOpenClipMovie(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    // The fix: clear movie.clips BEFORE fetching, and use a local slug variable
    // so if user navigates away during fetch, we don't corrupt another movie's data
    const OLD = `async function openClipMovie(movie) {\r\n    clipSelectedMovie = movie;\r\n    const area = document.getElementById('videosContent');\r\n\r\n    area.innerHTML = \`\r\n    <div id="clipcafeWrap" class="detail-mode">\r\n      <div class="state-box" style="margin-top:100px"><div class="spinner"></div><p>Carregando cenas de \${movie.title}...</p></div>\r\n    </div>\`;\r\n\r\n    try {\r\n        const url = \`\${SUPABASE_URL}/rest/v1/filmes_cortes?select=cena_url&filme_slug=eq.\${encodeURIComponent(movie.slug)}&limit=1000\`;\r\n        const res = await fetch(url, {\r\n            headers: { 'apikey': SUPABASE_KEY, 'Authorization': \`Bearer \${SUPABASE_KEY}\` }\r\n        });\r\n        if (res.ok) {\r\n            const rows = await res.json();\r\n            movie.clips = rows.map(r => ({ downloadUrl: r.cena_url }));\r\n        }\r\n    } catch (err) {\r\n        console.error('Erro ao buscar cenas:', err);\r\n    }`;

    const NEW = `async function openClipMovie(movie) {
    // Limpa clips do objeto para não usar cache sujo de outro filme
    movie.clips = [];
    clipSelectedMovie = movie;
    const targetSlug = movie.slug; // guarda slug para evitar race condition
    const area = document.getElementById('videosContent');

    area.innerHTML = \`
    <div id="clipcafeWrap" class="detail-mode">
      <div class="state-box" style="margin-top:100px"><div class="spinner"></div><p>Carregando cenas de \${movie.title}...</p></div>
    </div>\`;

    try {
        const url = \`\${SUPABASE_URL}/rest/v1/filmes_cortes?select=cena_url&filme_slug=eq.\${encodeURIComponent(movie.slug)}&limit=1000\`;
        const res = await fetch(url, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': \`Bearer \${SUPABASE_KEY}\` }
        });
        if (res.ok) {
            const rows = await res.json();
            // Race condition: se o usuario foi para outro filme, não sobrescreve
            if (clipSelectedMovie && clipSelectedMovie.slug === targetSlug) {
                movie.clips = rows.map(r => ({ downloadUrl: r.cena_url }));
            } else {
                return; // usuário já saiu, abandona
            }
        }
    } catch (err) {
        console.error('Erro ao buscar cenas:', err);
    }`;

    if (c.includes('async function openClipMovie')) {
        // Use raw string replacement since the template literals make it tricky
        const startIdx = c.indexOf('async function openClipMovie(movie) {');
        // Find end of the try/catch: look for the line after "Erro ao buscar cenas"
        const errLine = c.indexOf("console.error('Erro ao buscar cenas:', err);", startIdx);
        const endOfCatch = c.indexOf('    }', errLine) + '    }'.length;

        console.log('Found at:', startIdx, 'try/catch ends at:', endOfCatch);
        console.log('Replacing:', JSON.stringify(c.substring(startIdx, endOfCatch)));

        c = c.substring(0, startIdx) + NEW + c.substring(endOfCatch);
        fs.writeFileSync(filePath, c, 'utf8');
        console.log('✓ Fixed:', filePath, 'size:', c.length);
    } else {
        console.log('✗ openClipMovie not found in:', filePath);
    }
}

fixOpenClipMovie('Davinci/js/main.js');
fixOpenClipMovie('Premiere/com.editormaster.premium.v1/js/main.js');
