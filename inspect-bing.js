const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('bing_debug.html', 'utf8');
const $ = cheerio.load(html);

console.log('所有li class (前20):');
$('li').slice(0, 20).each((i, el) => {
    const c = $(el).attr('class');
    if (c) console.log(' -', c);
});

console.log('\n所有主要div/section id:');
$('[id]').slice(0, 40).each((i, el) => {
    const id = $(el).attr('id');
    if (id) console.log(' #' + id);
});

console.log('\n含"algo"的元素:');
$('[class*="algo"]').slice(0, 10).each((i, el) => {
    console.log(' -', el.name, $(el).attr('class'));
});

console.log('\n所有 a[href^="http"] 前5个:');
$('a[href^="http"]').not('[href*="bing.com"]').not('[href*="microsoft.com"]').slice(0, 5).each((i, el) => {
    console.log(` [${i+1}] ${$(el).text().trim().substring(0,50)} -> ${$(el).attr('href').substring(0,60)}`);
});
