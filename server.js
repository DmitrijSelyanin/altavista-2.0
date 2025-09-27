const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/search', async (req, res) => {
  const query = req.query.q;
  const type = req.query.type || 'web';
  if (!query) return res.status(400).json({ error: 'Missing query' });

  let bingURL = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  if (type === 'images') bingURL = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  if (type === 'videos') bingURL = `https://www.bing.com/videos/search?q=${encodeURIComponent(query)}`;
  if (type === 'news')   bingURL = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`;

  const results = [];

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0.0 Safari/537.36');
    await page.goto(bingURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const html = await page.content();
    await browser.close();
    const $ = cheerio.load(html);

    if (type === 'web') {
      $('li.b_algo').each((_, el) => {
        const title = $(el).find('h2').text().trim();
        const url = $(el).find('h2 a').attr('href');
        const snippet = $(el).find('p').text().trim();
        if (title && url) results.push({ title, url, snippet });
      });
    }

    if (type === 'images') {
      $('a.iusc').each((_, el) => {
        const m = $(el).attr('m');
        try {
          const meta = JSON.parse(m);
          const title = meta.t || 'Image';
          const url = meta.murl;
          const snippet = meta.desc || '';
          if (title && url) results.push({ title, url, snippet });
        } catch {}
      });
    }

    if (type === 'videos') {
      $('div.mc_vtvc').each((_, el) => {
        const title = $(el).find('h3').text().trim();
        const url = $(el).find('a').attr('href');
        const snippet = $(el).find('.b_caption p').text().trim();
        if (title && url) results.push({ title, url, snippet });
      });
    }

    if (type === 'news') {
      $('div.news-card, div.t_t').each((_, el) => {
        const title = $(el).find('a').text().trim();
        const url = $(el).find('a').attr('href');
        const snippet = $(el).find('p').text().trim();
        if (title && url) results.push({ title, url, snippet });
      });
    }

    console.log(`🔎 Bing ${type} results for "${query}": ${results.length} found`);
    res.json(results);
  } catch (err) {
    console.error(`❌ Bing scrape failed: ${err.message}`);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AltaVista 2.0 running at http://localhost:${PORT}`);
});