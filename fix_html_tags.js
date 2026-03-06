const fs = require('fs');

// Fix DaVinci
let c = fs.readFileSync('Davinci/js/main.js', 'utf8');
c = c.replace(/< div class= "/g, '<div class="');
c = c.replace(/< div class="/g, '<div class="');
c = c.replace(/<\/div >/g, '</div>');
c = c.replace(/< div >/g, '<div>');
c = c.replace(/< p >/g, '<p>');
c = c.replace(/<\/p >/g, '</p>');
c = c.replace(/< span /g, '<span ');
c = c.replace(/<\/span >/g, '</span>');
c = c.replace(/< button /g, '<button ');
c = c.replace(/<\/button >/g, '</button>');
c = c.replace(/< svg /g, '<svg ');
c = c.replace(/<\/svg >/g, '</svg>');
c = c.replace(/< img /g, '<img ');
c = c.replace(/< video /g, '<video ');
c = c.replace(/< source /g, '<source ');
c = c.replace(/< audio /g, '<audio ');
fs.writeFileSync('Davinci/js/main.js', c, 'utf8');
console.log('DaVinci OK:', c.length);

// Fix Premiere
const premPath = 'Premiere/com.editormaster.premium.v1/js/main.js';
let p = fs.readFileSync(premPath, 'utf8');
p = p.replace(/< div class= "/g, '<div class="');
p = p.replace(/< div class="/g, '<div class="');
p = p.replace(/<\/div >/g, '</div>');
p = p.replace(/< div >/g, '<div>');
p = p.replace(/< p >/g, '<p>');
p = p.replace(/<\/p >/g, '</p>');
p = p.replace(/< span /g, '<span ');
p = p.replace(/<\/span >/g, '</span>');
p = p.replace(/< button /g, '<button ');
p = p.replace(/<\/button >/g, '</button>');
p = p.replace(/< svg /g, '<svg ');
p = p.replace(/<\/svg >/g, '</svg>');
p = p.replace(/< img /g, '<img ');
p = p.replace(/< video /g, '<video ');
p = p.replace(/< source /g, '<source ');
p = p.replace(/< audio /g, '<audio ');
fs.writeFileSync(premPath, p, 'utf8');
console.log('Premiere OK:', p.length);
