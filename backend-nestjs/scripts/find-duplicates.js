const fs = require('fs');
const cats = JSON.parse(fs.readFileSync('category-report.json', 'utf8'));

const nameMap = {};
cats.forEach(c => {
  const norm = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!nameMap[norm]) nameMap[norm] = [];
  nameMap[norm].push(c);
});

const duplicates = Object.entries(nameMap).filter(([k, list]) => list.length > 1);
console.log('Duplicate names:');
duplicates.forEach(([k, list]) => {
  console.log(k, '->', list.map(x => ({ id: x.id, name: x.name, slug: x.slug, parentId: x.parentId, imgType: x.imgType })));
});

fs.writeFileSync('duplicates.json', JSON.stringify(duplicates, null, 2));
