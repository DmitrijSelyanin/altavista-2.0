let currentType = 'web';

document.getElementById('searchBtn').addEventListener('click', search);
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});

document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    search();
  });
});

async function search() {
  const query = document.getElementById('searchInput').value.trim();
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  if (!query) {
    resultsContainer.innerHTML = `<p style="text-align:center;">AltaVista 2.0 is waiting for your search...</p>`;
    return;
  }

  resultsContainer.innerHTML = `<p style="text-align:center;">AltaVista 2.0 is finding the result to your search...</p>`;

  try {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}&type=${currentType}`);
    const data = await res.json();

    if (!data.length) {
      resultsContainer.innerHTML = `<p style="text-align:center;">AltaVista 2.0 has not found anything that matches your search.</p>`;
      return;
    }

    resultsContainer.innerHTML = '';
    data.forEach(result => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <h2><a href="${result.url}" target="_blank">${result.title}</a></h2>
        <p>${result.snippet}</p>
        <span class="source-tag">source: bing</span>
      `;
      resultsContainer.appendChild(card);
    });
  } catch (err) {
    resultsContainer.innerHTML = `<p style="text-align:center;">Search failed - AltaVista 2.0 is waiting for your new search.</p>`;
    console.error('Search error:', err);
  }
}