import { GUIDES_DATA } from '../src/data/guidesData.js';

for (const g of GUIDES_DATA) {
  const bodyText = [
    g.title,
    g.summary,
    ...g.keyTakeaways,
    ...g.sections.map(s => s.heading + ' ' + s.content)
  ].join(' ').trim();
  const bodyWords = bodyText.split(/\s+/).length;

  const totalText = [
    bodyText,
    g.table.title,
    g.table.description,
    ...g.table.headers,
    ...g.table.rows.flat(),
    g.checklist.title,
    g.checklist.description,
    ...g.checklist.items,
    ...g.faqs.map(f => f.question + ' ' + f.answer)
  ].join(' ').trim();
  const totalWords = totalText.split(/\s+/).length;

  console.log({
    slug: g.slug,
    bodyWords,
    totalWords,
    bodyOk: bodyWords >= 800 && bodyWords <= 1200,
    totalOk: totalWords >= 800 && totalWords <= 1200
  });
}
