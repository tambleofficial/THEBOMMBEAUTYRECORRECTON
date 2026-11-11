// 콘텐츠(content/*.json)를 페이지에 넣어주는 클라우드플레어 미들웨어.
// 1) window.__CMS 로 데이터를 넣고  2) 화면 틀의 {{ CT.* }} / {{ CS.* }} 자리표시를 서버에서 실제 값으로 채워서 보냅니다.
//    (사진을 처음부터 바로 받기 시작해서 등장 효과가 원본처럼 자연스럽고, 검색엔진도 실제 문구를 읽어요)
const PAGE_FILES = { '': ['main', 'portfolio', 'reviews'], index: ['main', 'portfolio', 'reviews'] };
const CT_FILE = { '': 'main', index: 'main' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fill(html, key, data) {
  const cut = html.indexOf('<script type="text/x-dc"');
  if (cut < 0) return html;
  const site = data.site || {};
  const CS = Object.assign({}, site, { tel: 'tel:' + String(site.phone || '').replace(/[^0-9]/g, '') });
  const CT = ((data[CT_FILE[key]] || {}).t) || {};
  const tpl = html.slice(0, cut).replace(/\{\{ (CT|CS)\.([A-Za-z0-9_]+) \}\}/g, (m, root, field) => {
    const v = root === 'CT' ? CT[field] : CS[field];
    return (typeof v === 'string' || typeof v === 'number') ? esc(v) : m;
  });
  return tpl + html.slice(cut);
}

export async function onRequest(ctx) {
  const res = await ctx.next();
  const url = new URL(ctx.request.url);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/html') || url.pathname.startsWith('/edit') || url.pathname.startsWith('/api/')) return res;
  const key = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  if (!PAGE_FILES[key]) return res;
  const data = {};
  await Promise.all(['site', ...PAGE_FILES[key]].map(async (name) => {
    try {
      const r = await ctx.env.ASSETS.fetch(new URL('/content/' + name + '.json', url));
      if (r.ok) data[name] = await r.json();
    } catch (e) { /* 파일이 없으면 건너뜀 */ }
  }));
  let html = fill(await res.text(), key, data);
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  html = html.replace(/<head>/i, (m) => m + '<script>window.__CMS=' + json + ';</script>');
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(html, { status: res.status, headers });
}
