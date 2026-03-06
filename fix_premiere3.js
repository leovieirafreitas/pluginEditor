const fs = require('fs');
const PREM = 'Premiere/com.editormaster.premium.v1/js/main.js';
let c = fs.readFileSync(PREM, 'utf8');

// Find and replace the movieMap block
const startMarker = '        const movieMap = {};';
const endMarker = '        });';  // closes sort()

const startIdx = c.indexOf(startMarker);
// Find the sort closing
const sortEnd = c.indexOf('\r\n        });', startIdx) + '\r\n        });'.length;

console.log('movieMap start:', startIdx, 'sort end:', sortEnd);
console.log('Replacing block:', JSON.stringify(c.substring(startIdx, sortEnd)));

const replacement = `        // A view já retorna um filme por linha, sem duplicatas
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

c = c.substring(0, startIdx) + replacement + c.substring(sortEnd);
fs.writeFileSync(PREM, c, 'utf8');
console.log('Done! File size:', c.length);
