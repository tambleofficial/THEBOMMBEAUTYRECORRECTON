// 콘텐츠(content/*.json)를 페이지에 넣어주는 클라우드플레어 미들웨어.
// 1) window.__CMS 로 데이터를 넣고  2) 화면 틀의 {{ CT.* }} / {{ CS.* }} 자리표시를 서버에서 실제 값으로 채워서 보냅니다.
//    (사진을 처음부터 바로 받기 시작해서 등장 효과가 원본처럼 자연스럽고, 검색엔진도 실제 문구를 읽어요)
const PAGE_FILES = { '': ['main', 'portfolio', 'reviews'], index: ['main', 'portfolio', 'reviews'] };
const CT_FILE = { '': 'main', index: 'main' };
// 세부 페이지 주소(/portfolio 등)도 같은 화면을 쓰고, 제목·설명·대표주소만 페이지별로 바꿉니다.
const SUB_META = {"recorrection":["RE:CORRECTION 리커렉션 · 상태별 안내 | 더봄뷰티 리커렉션","새로 그리기 전에, 남아 있는 것부터 봅니다. 리커렉션의 기준과 함께 상태·부위별로 상담에서 확인하는 포인트를 안내합니다."],"portfolio":["PORTFOLIO 포트폴리오 | 더봄뷰티 리커렉션","같은 고객의 실제 전후 사진만 보여드립니다. 기존 상태에 따라 결과에는 차이가 있을 수 있습니다."],"caselab":["CASE LAB 실제 사례 | 더봄뷰티 리커렉션","결과 사진보다 먼저, 현재 상태를 봅니다. 각 사례에서 무엇을 먼저 확인했고 어떤 방향을 상담했는지 기록합니다."],"director":["DIRECTOR 대표원장 | 더봄뷰티 리커렉션","무엇을 더할지보다 지금 무엇이 남아 있는지를 먼저 확인합니다. 장형겸 대표원장의 상담 기준."],"consult":["CONSULT 상담 안내 | 더봄뷰티 리커렉션","예전 작업 때문에 고민이라면, 메뉴보다 현재 상태부터 알려주세요."]};
for (const k of Object.keys(SUB_META)) { PAGE_FILES[k] = PAGE_FILES['']; CT_FILE[k] = 'main'; }
function subMeta(html, key) {
  const m = SUB_META[key]; if (!m) return html;
  const u = 'https://thebommrecorrection.co.kr/' + key;
  return html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(m[0]) + '</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/, '$1' + esc(m[1]) + '$2')
    .replace(/(<meta property="og:description" content=")[^"]*(")/, '$1' + esc(m[1]) + '$2')
    .replace(/(<meta property="og:title" content=")[^"]*(")/, '$1' + esc(m[0]) + '$2')
    .replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + u + '$2')
    .replace(/(<meta property="og:url" content=")[^"]*(")/, '$1' + u + '$2');
}
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
  let html = subMeta(fill(await res.text(), key, data), key);
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  html = html.replace(/<head>/i, (m) => m + '<script>window.__CMS=' + json + ';</script>');
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(html, { status: res.status, headers });
}
