const fs = require('fs');

function fixRenderClipGrid(filePath) {
    let c = fs.readFileSync(filePath, 'utf8');

    // Old signature: renderClipGridPaginated(movie, page)
    // New signature: renderClipGridPaginated(clips, movie, page)

    const OLD_SIG = 'function renderClipGridPaginated(movie, page) {';
    const NEW_SIG = 'function renderClipGridPaginated(clips, movie, page) {';

    // Also fix: const clips = movie.clips || []; -> remove that line since clips is now param
    const OLD_CLIPS = `    const clips = movie.clips || [];\r\n    const start = page * CLIP_PAGE_SIZE;`;
    const NEW_CLIPS = `    const start = page * CLIP_PAGE_SIZE;`;

    if (c.includes(OLD_SIG)) {
        c = c.replace(OLD_SIG, NEW_SIG);
        console.log('✓ Signature updated:', filePath);
    } else {
        console.log('✗ Signature not found');
    }

    if (c.includes(OLD_CLIPS)) {
        c = c.replace(OLD_CLIPS, NEW_CLIPS);
        console.log('✓ clips line removed:', filePath);
    } else {
        // Try \n version
        const OLD_CLIPS2 = `    const clips = movie.clips || [];\n    const start = page * CLIP_PAGE_SIZE;`;
        if (c.includes(OLD_CLIPS2)) {
            c = c.replace(OLD_CLIPS2, `    const start = page * CLIP_PAGE_SIZE;`);
            console.log('✓ clips line (\\n) removed:', filePath);
        } else {
            console.log('✗ clips line not found, looking manually...');
            const idx = c.indexOf('const clips = movie.clips || []');
            if (idx !== -1) {
                const lineEnd = c.indexOf('\n', idx) + 1;
                c = c.substring(0, idx) + c.substring(lineEnd);
                console.log('✓ clips line removed manually');
            }
        }
    }

    // Fix recursive calls inside renderClipGridPaginated that call itself
    // These now need the clips parameter too
    // renderClipGridPaginated(movie, page + 1) -> renderClipGridPaginated(clips, movie, page + 1)
    const OLD_RECURSIVE = 'renderClipGridPaginated(movie, page + 1)';
    const NEW_RECURSIVE = 'renderClipGridPaginated(clips, movie, page + 1)';
    while (c.includes(OLD_RECURSIVE)) {
        c = c.replace(OLD_RECURSIVE, NEW_RECURSIVE);
    }

    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Done:', filePath, c.length);
}

fixRenderClipGrid('Davinci/js/main.js');
fixRenderClipGrid('Premiere/com.editormaster.premium.v1/js/main.js');
