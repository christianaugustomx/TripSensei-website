#!/usr/bin/env node
/* TripSensei — bilingual (ES/EN) itinerary SEO page generator.
   Joins itineraries.json (day-by-day plans) + destinations.json (city metadata)
   and emits static HTML + sitemap. No runtime deps (Node 18+).

   Usage:
     node seo/generate-itineraries.js .       # write into the site root
     node seo/generate-itineraries.js build   # preview into ./build
*/
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://tripsensei.com';            // <-- set your production domain
const WA     = 'https://wa.me/14154230178';         // TripSensei WhatsApp
const OUT    = process.argv[2] || './build';

const dests = JSON.parse(fs.readFileSync(path.join(__dirname,'destinations.json'),'utf8'));
const itins = JSON.parse(fs.readFileSync(path.join(__dirname,'itineraries.json'),'utf8'));
const bySlug = Object.fromEntries(dests.map(d => [d.slug, d]));

const esc     = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => esc(s).replace(/"/g,'&quot;');
const enc     = s => encodeURIComponent(String(s));

const L10N = {
  es:{ root:'/', dir:'/itinerarios/', altDir:'/en/itineraries/', destDir:'/destinos/',
       home:'Inicio', hub:'Itinerarios', switch:'English',
       waText:(c,n)=>`Hola%2C%20quiero%20personalizar%20el%20itinerario%20de%20${n}%20d%C3%ADas%20en%20${enc(c)}`,
       morning:'Mañana', afternoon:'Tarde', evening:'Noche',
       proTip:'Tip pro', faqTitle:'Preguntas frecuentes', related:'Otros itinerarios',
       guideLink:n=>`Guía de ${n}`, dayLabel:'días',
       ctaTitle:(c,n)=>`¿${n} días en ${c}? Te lo personalizamos`,
       ctaText:'Mándanos tus fechas, presupuesto y con quién viajas — TripSensei te ajusta el itinerario y te lo manda por WhatsApp. Sin apps, sin registro.',
       ctaBtn:'Personalizar por WhatsApp',
       disc:'Plan orientativo: tiempos de traslado, precios y horarios cambian. Confirma antes de salir.' },
  en:{ root:'/en/', dir:'/en/itineraries/', altDir:'/itinerarios/', destDir:'/en/destinations/',
       home:'Home', hub:'Itineraries', switch:'Español',
       waText:(c,n)=>`Hi%2C%20I%20want%20to%20personalize%20the%20${n}-day%20itinerary%20in%20${enc(c)}`,
       morning:'Morning', afternoon:'Afternoon', evening:'Evening',
       proTip:'Pro tip', faqTitle:'Frequently asked questions', related:'Other itineraries',
       guideLink:n=>`${n} travel guide`, dayLabel:'days',
       ctaTitle:(c,n)=>`${n} days in ${c}? We'll personalize it for you`,
       ctaText:'Share your dates, budget and who you travel with — TripSensei tweaks the itinerary and sends it on WhatsApp. No apps, no signup.',
       ctaBtn:'Personalize on WhatsApp',
       disc:'Planning content: drive times, prices and hours change. Confirm before you go.' }
};

const cityName   = (d,L)=> L==='en' ? d.en_name : d.name;
const countryOf  = (d,L)=> L==='en' ? d.country_en : d.country_es;
const slugSuffix = (n,L)=> L==='en' ? `${n}-days` : `${n}-dias`;
const pageUrl    = (slug,n,L)=> `${DOMAIN}${L10N[L].dir}${slug}-${slugSuffix(n,L)}.html`;
const guideUrl   = (slug,L)=>   `${DOMAIN}${L10N[L].destDir}${slug}.html`;

function faq(d, n, L){
  const c = cityName(d,L);
  if(L==='en') return [
    [`Is ${n} days enough for ${c}?`, `${n} days covers the highlights of ${c} at a comfortable pace. If you want to add nearby trips or slow the rhythm, TripSensei can stretch or shorten this plan to fit you.`],
    [`When should I book this ${n}-day trip?`, `Two to three months ahead works best for ${c}. Hotels and tours get scarce in high season — message TripSensei with your dates and we'll flag what to lock first.`],
    [`How much does a ${n}-day trip to ${c} cost?`, `It depends on style: backpacker plans run cheaper than resort stays. Send your budget to TripSensei on WhatsApp and we'll size the plan around it.`],
    [`Can I do this ${n}-day itinerary with kids?`, `Most of this plan works with kids; a couple of stops can be swapped for easier alternatives. Tell TripSensei the ages and we'll adapt it.`],
    [`Can TripSensei personalize this ${n}-day itinerary for me?`, `Yes. Send "${c} ${n} days" to TripSensei on WhatsApp and we'll tune day-by-day plans to your dates, pace and budget — no app to download.`]
  ];
  return [
    [`¿${n} días son suficientes para ${c}?`, `${n} días cubren lo mejor de ${c} a buen ritmo. Si quieres sumar excursiones cercanas o bajar la velocidad, TripSensei lo ajusta a tu medida.`],
    [`¿Con cuánto tiempo conviene reservar este viaje de ${n} días?`, `Dos o tres meses antes funciona mejor para ${c}. Hoteles y tours se agotan en temporada alta — mándale tus fechas a TripSensei y te decimos qué reservar primero.`],
    [`¿Cuánto cuesta un viaje de ${n} días a ${c}?`, `Depende del estilo: mochilero sale mucho más barato que all-inclusive. Mándale tu presupuesto a TripSensei por WhatsApp y armamos el plan a esa medida.`],
    [`¿Puedo hacer este itinerario de ${n} días con niños?`, `La mayor parte del plan funciona con niños; un par de paradas se pueden cambiar por alternativas más fáciles. Dile a TripSensei las edades y lo adaptamos.`],
    [`¿TripSensei me personaliza este itinerario de ${n} días?`, `Sí. Manda "${c} ${n} días" a TripSensei por WhatsApp y te afinamos el plan día por día según fechas, ritmo y presupuesto — sin descargar nada.`]
  ];
}

function related(slug, currentN, L){
  // Other day-counts for the same city + same day-count for other cities
  const out = [];
  for(const n of ['3','5','7']){
    if(String(currentN)===String(n)) continue;
    const it = itins[slug] && itins[slug][n];
    if(!it) continue;
    const d = bySlug[slug];
    out.push({ url:pageUrl(slug,n,L), flag:d.flag, label: L==='en'? `${n} days in ${cityName(d,L)}` : `${n} días en ${cityName(d,L)}` });
  }
  for(const otherSlug of Object.keys(itins)){
    if(otherSlug===slug) continue;
    const it = itins[otherSlug] && itins[otherSlug][String(currentN)];
    if(!it) continue;
    const d = bySlug[otherSlug];
    out.push({ url:pageUrl(otherSlug,currentN,L), flag:d.flag, label: L==='en'? `${currentN} days in ${cityName(d,L)}` : `${currentN} días en ${cityName(d,L)}` });
  }
  return out.slice(0,6).map(x=>`<li><a href="${L10N[L].dir}${path.basename(x.url)}">${esc(x.flag)} ${esc(x.label)}</a></li>`).join('');
}

function page(slug, n, L){
  const t = L10N[L];
  const d = bySlug[slug];
  const it = itins[slug][String(n)];
  if(!d || !it) return null;
  const c = cityName(d,L);
  const title = L==='en' ? `${it.title_en} | TripSensei` : `${it.title_es} | TripSensei`;
  const intro = L==='en' ? it.intro_en : it.intro_es;
  const proTip = L==='en' ? it.pro_tip_en : it.pro_tip_es;
  const url = pageUrl(slug,n,L);
  const altEN = pageUrl(slug,n,'en');
  const altES = pageUrl(slug,n,'es');
  const wa = `${WA}?text=${t.waText(c,n)}`;
  const desc = L==='en'
    ? `${n}-day itinerary in ${c}, ${countryOf(d,L)}: day-by-day plan with mornings, afternoons and evenings, plus a local pro tip. Personalize it free on WhatsApp.`
    : `Itinerario de ${n} días en ${c}, ${countryOf(d,L)}: plan día por día con mañanas, tardes y noches, más un tip pro local. Personalízalo gratis por WhatsApp.`;

  const daysHtml = it.days.map(day=>{
    const label = L==='en'? day.label_en : day.label_es;
    const m = L==='en'? day.morning_en : day.morning_es;
    const a = L==='en'? day.afternoon_en : day.afternoon_es;
    const e = L==='en'? day.evening_en : day.evening_es;
    return `<div class="day"><h3>${esc(label)}</h3>
<div class="seg"><span class="seg-l">${esc(t.morning)}</span><p>${esc(m)}</p></div>
<div class="seg"><span class="seg-l">${esc(t.afternoon)}</span><p>${esc(a)}</p></div>
<div class="seg"><span class="seg-l">${esc(t.evening)}</span><p>${esc(e)}</p></div></div>`;
  }).join('');

  const faqs = faq(d, n, L);
  const bc = [t.home, t.root, t.hub, t.dir];

  const ld = [
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":bc[0],"item":DOMAIN+bc[1]},
      {"@type":"ListItem","position":2,"name":bc[2],"item":DOMAIN+bc[3]},
      {"@type":"ListItem","position":3,"name":(L==='en'?`${n} days in ${c}`:`${n} días en ${c}`),"item":url}
    ]},
    {"@context":"https://schema.org","@type":"TouristTrip","name":(L==='en'?it.title_en:it.title_es),
      "description":intro,"url":url,
      "touristType":(L==='en'?'Leisure traveler':'Viajero de placer'),
      "itinerary":it.days.map((day,i)=>({
        "@type":"ListItem","position":i+1,
        "item":{"@type":"TouristAttraction","name":(L==='en'?day.label_en:day.label_es),
          "description":[L==='en'?day.morning_en:day.morning_es, L==='en'?day.afternoon_en:day.afternoon_es, L==='en'?day.evening_en:day.evening_es].join(' ')
        }
      })),
      "subjectOf":{"@type":"WebPage","url":guideUrl(slug,L)}
    },
    {"@context":"https://schema.org","@type":"FAQPage","mainEntity":faqs.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}
  ];

  const guideHref = L==='en' ? `${t.destDir}${slug}.html` : `${t.destDir}${slug}.html`;
  const guideLabel = t.guideLink(c);

  return `<!DOCTYPE html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${altEN}">
<link rel="alternate" hreflang="es" href="${altES}">
<link rel="alternate" hreflang="x-default" href="${altEN}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="TripSensei">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
:root{--bg:#fff;--warm:#f4f8fc;--text:#1a1a2e;--sec:#64607a;--mut:#9994a8;--teal:#0284c7;--teal-d:#0369a1;--teal-l:#e0f2fe;--orange:#e05b2a;--line:rgba(26,26,46,.08);--radius:16px;--radius-sm:10px;--shadow:0 4px 20px rgba(0,0,0,.06)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--sec);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:780px;margin:0 auto;padding:0 24px 72px}
a{color:var(--teal);text-decoration:none}
nav.top{position:sticky;top:0;z-index:50;background:rgba(244,248,252,.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--line)}
nav.top .row{max-width:780px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--text)}.logo span{color:var(--teal)}
.lang{font-size:.82rem;border:1px solid var(--line);padding:4px 12px;border-radius:20px;color:var(--sec)}
.bc{font-size:.82rem;color:var(--mut);margin:18px 0 6px}.bc a{color:var(--mut)}
h1{font-family:'Playfair Display',serif;font-size:2.1rem;line-height:1.15;color:var(--text);margin:.15em 0 .1em;letter-spacing:-.01em}
.flag{font-size:2.2rem}
.country{font-size:.9rem;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.lead{font-size:1.12rem;color:var(--sec);margin:14px 0 6px}
.meta{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}
.chip{background:var(--teal-l);color:var(--teal-d);font-size:.82rem;font-weight:600;padding:6px 14px;border-radius:20px}
.chip.alt{background:var(--warm);color:var(--text);border:1px solid var(--line)}
h2{font-family:'Playfair Display',serif;font-size:1.45rem;color:var(--text);margin:38px 0 14px}
.day{border:1px solid var(--line);border-radius:var(--radius-sm);padding:18px 20px;margin:14px 0;background:var(--bg);box-shadow:var(--shadow)}
.day h3{font-size:1.08rem;color:var(--text);margin-bottom:10px;font-weight:700}
.seg{display:grid;grid-template-columns:88px 1fr;gap:12px;padding:8px 0;border-top:1px solid var(--line)}
.seg:first-of-type{border-top:none;padding-top:2px}
.seg-l{color:var(--orange);font-weight:600;font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;padding-top:2px}
.seg p{font-size:.96rem;color:var(--sec);margin:0}
.callout{background:var(--warm);border-left:4px solid var(--orange);border-radius:8px;padding:14px 18px;margin:24px 0;color:var(--text)}
.callout b{color:var(--orange)}
.cta{background:linear-gradient(135deg,var(--teal),var(--teal-d));color:#fff;border-radius:var(--radius);padding:28px 24px;margin:36px 0;text-align:center}
.cta h2{color:#fff;margin:0 0 8px}.cta p{color:rgba(255,255,255,.92);margin:0 auto 16px;max-width:46ch}
.btn{display:inline-flex;align-items:center;gap:9px;background:#fff;color:var(--teal-d);font-weight:700;padding:13px 26px;border-radius:30px;font-size:1rem}
.faq dt{font-weight:600;color:var(--text);margin-top:16px}.faq dd{margin:4px 0 0;color:var(--sec)}
ul.rel{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0}
ul.rel a{display:block;border:1px solid var(--line);border-radius:var(--radius-sm);padding:11px 14px;color:var(--text);font-weight:500;font-size:.95rem}
.disc{font-size:.78rem;color:var(--mut);border-top:1px solid var(--line);margin-top:40px;padding-top:16px}
footer{font-size:.82rem;color:var(--mut);margin-top:14px}footer a{color:var(--mut)}
@media(max-width:520px){ul.rel{grid-template-columns:1fr}h1{font-size:1.7rem}.seg{grid-template-columns:1fr;gap:2px}.seg-l{padding-top:6px}}
</style>
</head>
<body>
<nav class="top"><div class="row"><a class="logo" href="${t.root}">Trip<span>Sensei</span></a><a class="lang" href="${L==='en'?altES:altEN}" hreflang="${L==='en'?'es':'en'}">${t.switch}</a></div></nav>
<div class="wrap">
<nav class="bc"><a href="${bc[1]}">${bc[0]}</a> › <a href="${bc[3]}">${bc[2]}</a> › ${esc(L==='en'?`${n} days in ${c}`:`${n} días en ${c}`)}</nav>
<div class="flag">${esc(d.flag)}</div>
<div class="country">${esc(countryOf(d,L))}</div>
<h1>${esc(L==='en'?it.title_en:it.title_es)}</h1>
<p class="lead">${esc(intro)}</p>
<div class="meta">
  <span class="chip">📅 ${n} ${esc(t.dayLabel)}</span>
  <a class="chip alt" href="${guideHref}">📖 ${esc(guideLabel)} →</a>
</div>

<h2>${esc(L==='en'?'Day-by-day plan':'Plan día a día')}</h2>
${daysHtml}

<div class="callout"><b>${esc(t.proTip)} 🧭</b> ${esc(proTip)}</div>

<div class="cta">
<h2>${esc(t.ctaTitle(c,n))}</h2>
<p>${esc(t.ctaText)}</p>
<a class="btn" href="${wa}" rel="nofollow">💬 ${esc(t.ctaBtn)}</a>
</div>

<h2>${esc(t.faqTitle)}</h2>
<dl class="faq">${faqs.map(([q,a])=>`<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>

<h2>${esc(t.related)}</h2>
<ul class="rel">${related(slug,n,L)}</ul>

<p class="disc">${esc(t.disc)}</p>
<footer>© ${new Date().getFullYear()} TripSensei · <a href="${t.root}">${t.home}</a> · <a href="${t.dir}">${t.hub}</a></footer>
</div>
</body>
</html>`;
}

function hub(L){
  const t = L10N[L];
  const url = `${DOMAIN}${t.dir}`;
  const title = L==='en' ? 'Travel Itineraries — Day-by-Day Plans | TripSensei' : 'Itinerarios de viaje — Planes día por día | TripSensei';
  const desc = L==='en'
    ? 'Day-by-day travel itineraries for top destinations: 3, 5 and 7-day plans with mornings, afternoons and evenings. Personalize any plan on WhatsApp.'
    : 'Itinerarios de viaje día por día para los mejores destinos: planes de 3, 5 y 7 días con mañanas, tardes y noches. Personaliza cualquier plan por WhatsApp.';

  const groups = Object.keys(itins).map(slug=>{
    const d = bySlug[slug]; if(!d) return '';
    const c = cityName(d,L);
    const items = ['3','5','7'].filter(n=>itins[slug][n]).map(n=>{
      const href = `${t.dir}${slug}-${slugSuffix(n,L)}.html`;
      return `<li><a href="${href}"><span>${esc(d.flag)} ${esc(c)}</span> <span class="n">${n} ${esc(t.dayLabel)}</span></a></li>`;
    }).join('');
    return `<h2>${esc(d.flag)} ${esc(c)}</h2><ul>${items}</ul>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${L}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${DOMAIN}${L10N.en.dir}">
<link rel="alternate" hreflang="es" href="${DOMAIN}${L10N.es.dir}">
<link rel="alternate" hreflang="x-default" href="${DOMAIN}${L10N.en.dir}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{--text:#1a1a2e;--sec:#64607a;--mut:#9994a8;--teal:#0284c7;--line:rgba(26,26,46,.08)}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',-apple-system,sans-serif;color:var(--sec);line-height:1.65}
.wrap{max-width:840px;margin:0 auto;padding:24px 24px 72px}
.logo{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--text)}.logo span{color:var(--teal)}
.lang{float:right;font-size:.82rem;border:1px solid var(--line);padding:4px 12px;border-radius:20px;color:var(--sec);text-decoration:none}
h1{font-family:'Playfair Display',serif;font-size:2.1rem;color:var(--text);margin:18px 0 8px}
h2{font-family:'Playfair Display',serif;font-size:1.35rem;color:var(--text);margin:32px 0 12px}
ul{list-style:none;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:0}
li a{display:flex;justify-content:space-between;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px;color:var(--text);font-weight:500;text-decoration:none}
li .n{color:var(--mut);font-size:.8rem}
@media(max-width:520px){ul{grid-template-columns:1fr}}
</style>
</head>
<body><div class="wrap">
<a class="logo" href="${t.root}">Trip<span>Sensei</span></a><a class="lang" href="${L==='en'?L10N.es.dir:L10N.en.dir}">${t.switch}</a>
<h1>${L==='en'?'Travel itineraries':'Itinerarios de viaje'}</h1>
<p>${L==='en'?'Day-by-day plans for 3, 5 or 7-day trips — then get yours personalized on WhatsApp.':'Planes día por día para viajes de 3, 5 o 7 días — luego recibe el tuyo personalizado por WhatsApp.'}</p>
${groups}
</div></body></html>`;
}

// ---- write ----
const dEN = path.join(OUT,'en','itineraries'), dES = path.join(OUT,'itinerarios');
fs.rmSync(dEN,{recursive:true,force:true}); fs.rmSync(dES,{recursive:true,force:true});
fs.mkdirSync(dEN,{recursive:true}); fs.mkdirSync(dES,{recursive:true});

const pairs = [];
for(const slug of Object.keys(itins)){
  for(const n of ['3','5','7']){
    if(!itins[slug][n]) continue;
    fs.writeFileSync(path.join(dES, `${slug}-${slugSuffix(n,'es')}.html`), page(slug,n,'es'));
    fs.writeFileSync(path.join(dEN, `${slug}-${slugSuffix(n,'en')}.html`), page(slug,n,'en'));
    pairs.push({slug, n});
  }
}
fs.writeFileSync(path.join(dES,'index.html'), hub('es'));
fs.writeFileSync(path.join(dEN,'index.html'), hub('en'));

const today = new Date().toISOString().slice(0,10);
const entry=(loc,en,es)=>`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n    <xhtml:link rel="alternate" hreflang="es" href="${es}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>\n  </url>`;
let sm=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
sm+=entry(`${DOMAIN}${L10N.es.dir}`,`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.es.dir}`)+'\n';
sm+=entry(`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.es.dir}`)+'\n';
for(const {slug,n} of pairs){
  const en = pageUrl(slug,n,'en'), es = pageUrl(slug,n,'es');
  sm+=entry(es,en,es)+'\n'; sm+=entry(en,en,es)+'\n';
}
sm+=`</urlset>\n`;
fs.writeFileSync(path.join(OUT,'sitemap-itinerarios.xml'), sm);

console.log('Generated', pairs.length, 'itinerary slots ->', pairs.length*2, 'pages + 2 hubs + sitemap into', OUT);
