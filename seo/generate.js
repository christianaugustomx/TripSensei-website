#!/usr/bin/env node
/* TripSensei — bilingual (ES/EN) destination SEO page generator.
   Reads destinations.json and emits static HTML + sitemap + robots.
   Pattern forked from CalorIA Scan's generator. No runtime deps (Node 18+).

   Usage:
     node seo/generate.js .        # write into the site root (destinos/, en/destinations/, sitemap.xml, robots.txt)
     node seo/generate.js build    # preview into ./build
*/
const fs = require('fs');
const path = require('path');

const DOMAIN  = 'https://tripsensei.net';            // <-- set your production domain
const WA      = 'https://wa.me/14154230178';         // TripSensei WhatsApp
const OUT     = process.argv[2] || './build';
const dests   = JSON.parse(fs.readFileSync(path.join(__dirname,'destinations.json'),'utf8'));

const esc     = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => esc(s).replace(/"/g,'&quot;');
const enc     = s => encodeURIComponent(String(s));

const L10N = {
  es:{ root:'/', dir:'/destinos/', altDir:'/en/destinations/', home:'Inicio', hub:'Destinos',
       switch:'English', waText:d=>`Hola%2C%20quiero%20tips%20para%20${enc(d)}`,
       things:d=>`Qué hacer en ${d}`, best:'Mejor época para ir', tip:'Tip de un local',
       faqTitle:'Preguntas frecuentes', related:'Otros destinos', days:'Días sugeridos',
       ctaTitle:d=>`¿Vas a ${d}? Llévate un concierge en el bolsillo`,
       ctaText:'TripSensei te manda tips personalizados directo a tu WhatsApp — antes y durante tu viaje. Sin apps, sin registro.',
       ctaBtn:'Pedir tips por WhatsApp',
       disc:'Información orientativa para planear tu viaje. Horarios, precios y condiciones cambian; confirma antes de ir.' },
  en:{ root:'/en/', dir:'/en/destinations/', altDir:'/destinos/', home:'Home', hub:'Destinations',
       switch:'Español', waText:d=>`Hi%2C%20I%20want%20tips%20for%20${enc(d)}`,
       things:d=>`Things to do in ${d}`, best:'Best time to go', tip:'Local tip',
       faqTitle:'Frequently asked questions', related:'More destinations', days:'Suggested days',
       ctaTitle:d=>`Going to ${d}? Put a concierge in your pocket`,
       ctaText:'TripSensei sends personalized tips straight to your WhatsApp — before and during your trip. No apps, no signup.',
       ctaBtn:'Get tips on WhatsApp',
       disc:'Informational travel-planning content. Hours, prices and conditions change; confirm before you go.' }
};

const name   = (d,L)=> L==='en' ? d.en_name : d.name;
const country= (d,L)=> L==='en' ? d.country_en : d.country_es;
const intro  = (d,L)=> L==='en' ? d.intro_en : d.intro_es;
const best   = (d,L)=> L==='en' ? d.best_en : d.best_es;
const tip    = (d,L)=> L==='en' ? d.tip_en : d.tip_es;
const urlFor = (d,L)=> `${DOMAIN}${L10N[L].dir}${d.slug}.html`;

function faq(d,L){
  const dn = name(d,L);
  if(L==='en') return [
    [`How many days do you need in ${dn}?`, `Most travelers spend ${d.days} days in ${dn}. TripSensei can build a day-by-day plan tuned to how long you have.`],
    [`When is the best time to visit ${dn}?`, best(d,L)],
    [`Is ${dn} worth visiting?`, `Yes — ${dn}, ${country(d,L)} rewards a few days of exploring. Message TripSensei and we'll tell you exactly what's worth your time based on your dates.`],
    [`How do I get around ${dn}?`, tip(d,L)],
    [`Can TripSensei give me tips for ${dn}?`, `Yes. Send "${dn}" to TripSensei on WhatsApp and get personalized recommendations, weather and safety alerts in seconds — no app to download.`]
  ];
  return [
    [`¿Cuántos días necesito en ${dn}?`, `La mayoría pasa ${d.days} días en ${dn}. TripSensei te arma un plan día por día según el tiempo que tengas.`],
    [`¿Cuál es la mejor época para visitar ${dn}?`, best(d,L)],
    [`¿Vale la pena visitar ${dn}?`, `Sí — ${dn}, ${country(d,L)} se disfruta en pocos días. Escríbele a TripSensei y te decimos exactamente qué vale la pena según tus fechas.`],
    [`¿Cómo me muevo en ${dn}?`, tip(d,L)],
    [`¿TripSensei me da tips de ${dn}?`, `Sí. Manda "${dn}" a TripSensei por WhatsApp y recibe recomendaciones personalizadas, clima y alertas de seguridad en segundos — sin descargar nada.`]
  ];
}

function related(d, all, L){
  const sib = all.filter(x=>x.slug!==d.slug && x.cluster===d.cluster);
  const pool = (sib.length>=3 ? sib : all.filter(x=>x.slug!==d.slug)).slice(0,6);
  return pool.map(x=>`<li><a href="${L10N[L].dir}${x.slug}.html">${esc(x.flag)} ${esc(name(x,L))}</a></li>`).join('');
}

function page(d, all, L){
  const t = L10N[L], dn = name(d,L);
  const url = urlFor(d,L), altEN = urlFor(d,'en'), altES = urlFor(d,'es');
  const wa = `${WA}?text=${t.waText(dn)}`;
  const title = L==='en'
    ? `${dn} Travel Guide: Things to Do & Best Time to Go | TripSensei`
    : `Qué hacer en ${dn}: Guía de viaje y mejor época | TripSensei`;
  const desc = L==='en'
    ? `What to do in ${dn}, ${country(d,L)}: top things to see, the best time to visit and a local tip. Plan it with a free WhatsApp concierge.`
    : `Qué hacer en ${dn}, ${country(d,L)}: lo mejor para ver, la mejor época para ir y un tip local. Planéalo con un concierge gratis por WhatsApp.`;

  const things = d.things.map(x=>{
    const tt = L==='en'?x.t_en:x.t_es, dd = L==='en'?x.d_en:x.d_es;
    return `<div class="thing"><h3>${esc(tt)}</h3><p>${esc(dd)}</p></div>`;
  }).join('');

  const faqs = faq(d,L);
  const bc = L==='en' ? [t.home,t.root,t.hub,t.dir] : [t.home,t.root,t.hub,t.dir];

  const ld = [
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":bc[0],"item":DOMAIN+bc[1]},
      {"@type":"ListItem","position":2,"name":bc[2],"item":DOMAIN+bc[3]},
      {"@type":"ListItem","position":3,"name":dn,"item":url}
    ]},
    {"@context":"https://schema.org","@type":"TouristDestination","name":dn,
      "address":{"@type":"PostalAddress","addressCountry":country(d,L)},"url":url,"description":intro(d,L)},
    {"@context":"https://schema.org","@type":"FAQPage","mainEntity":faqs.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}
  ];

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
h2{font-family:'Playfair Display',serif;font-size:1.45rem;color:var(--text);margin:38px 0 14px}
.thing{border:1px solid var(--line);border-radius:var(--radius-sm);padding:16px 18px;margin:10px 0;background:var(--bg);box-shadow:var(--shadow)}
.thing h3{font-size:1.05rem;color:var(--text);margin-bottom:4px}.thing p{font-size:.96rem}
.callout{background:var(--warm);border-left:4px solid var(--orange);border-radius:8px;padding:14px 18px;margin:16px 0;color:var(--text)}
.callout b{color:var(--orange)}
.cta{background:linear-gradient(135deg,var(--teal),var(--teal-d));color:#fff;border-radius:var(--radius);padding:28px 24px;margin:36px 0;text-align:center}
.cta h2{color:#fff;margin:0 0 8px}.cta p{color:rgba(255,255,255,.92);margin:0 auto 16px;max-width:46ch}
.btn{display:inline-flex;align-items:center;gap:9px;background:#fff;color:var(--teal-d);font-weight:700;padding:13px 26px;border-radius:30px;font-size:1rem}
.faq dt{font-weight:600;color:var(--text);margin-top:16px}.faq dd{margin:4px 0 0;color:var(--sec)}
ul.rel{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0}
ul.rel a{display:block;border:1px solid var(--line);border-radius:var(--radius-sm);padding:11px 14px;color:var(--text);font-weight:500;font-size:.95rem}
.disc{font-size:.78rem;color:var(--mut);border-top:1px solid var(--line);margin-top:40px;padding-top:16px}
footer{font-size:.82rem;color:var(--mut);margin-top:14px}footer a{color:var(--mut)}
@media(max-width:520px){ul.rel{grid-template-columns:1fr}h1{font-size:1.7rem}}
</style>
</head>
<body>
<nav class="top"><div class="row"><a class="logo" href="${t.root}">Trip<span>Sensei</span></a><a class="lang" href="${L==='en'?altES:altEN}" hreflang="${L==='en'?'es':'en'}">${t.switch}</a></div></nav>
<div class="wrap">
<nav class="bc"><a href="${bc[1]}">${bc[0]}</a> › <a href="${bc[3]}">${bc[2]}</a> › ${esc(dn)}</nav>
<div class="flag">${esc(d.flag)}</div>
<div class="country">${esc(country(d,L))}</div>
<h1>${esc(t.things(dn))}</h1>
<p class="lead">${esc(intro(d,L))}</p>
<div class="meta"><span class="chip">📅 ${esc(t.days)}: ${esc(d.days)}</span></div>

<h2>${esc(t.things(dn))}</h2>
${things}

<div class="callout"><b>${esc(t.best)}.</b> ${esc(best(d,L))}</div>
<div class="callout"><b>${esc(t.tip)} 🧭</b> ${esc(tip(d,L))}</div>

<div class="cta">
<h2>${esc(t.ctaTitle(dn))}</h2>
<p>${esc(t.ctaText)}</p>
<a class="btn" href="${wa}" rel="nofollow">💬 ${esc(t.ctaBtn)}</a>
</div>

<h2>${esc(t.faqTitle)}</h2>
<dl class="faq">${faqs.map(([q,a])=>`<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>

<h2>${esc(t.related)}</h2>
<ul class="rel">${related(d,all,L)}</ul>

<p class="disc">${esc(t.disc)}</p>
<footer>© ${new Date().getFullYear()} TripSensei · <a href="${t.root}">${t.home}</a> · <a href="${t.dir}">${t.hub}</a></footer>
</div>
</body>
</html>`;
}

function hub(all, L){
  const t = L10N[L];
  const url = `${DOMAIN}${t.dir}`;
  const title = L==='en' ? 'Travel Destinations — Things to Do & Guides | TripSensei' : 'Destinos de viaje — Qué hacer y guías | TripSensei';
  const desc = L==='en' ? 'Travel guides for top destinations across the Americas and beyond: what to do, when to go and local tips. Plan any trip with a free WhatsApp concierge.' : 'Guías de viaje de los mejores destinos de América y más: qué hacer, cuándo ir y tips locales. Planea cualquier viaje con un concierge gratis por WhatsApp.';
  const groups = {};
  all.forEach(d=>{ (groups[d.cluster] ||= []).push(d); });
  const clusterName = { mexico:{es:'México',en:'Mexico'}, sudamerica:{es:'Sudamérica y Caribe',en:'South America & Caribbean'}, usa:{es:'Estados Unidos',en:'United States'} };
  const order = ['mexico','sudamerica','usa'];
  const sections = order.filter(c=>groups[c]).map(c=>{
    const items = groups[c].sort((a,b)=>name(a,L).localeCompare(name(b,L)))
      .map(d=>`<li><a href="${t.dir}${d.slug}.html">${esc(d.flag)} ${esc(name(d,L))} <span>${esc(d.days)} ${L==='en'?'days':'días'}</span></a></li>`).join('');
    return `<h2>${esc((clusterName[c]||{})[L]||c)}</h2><ul>${items}</ul>`;
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
ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0}
li a{display:flex;justify-content:space-between;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px;color:var(--text);font-weight:500;text-decoration:none}
li span{color:var(--mut);font-size:.8rem}
@media(max-width:520px){ul{grid-template-columns:1fr}}
</style>
</head>
<body><div class="wrap">
<a class="logo" href="${t.root}">Trip<span>Sensei</span></a><a class="lang" href="${L==='en'?L10N.es.dir:L10N.en.dir}">${t.switch}</a>
<h1>${L==='en'?'Travel destinations':'Destinos de viaje'}</h1>
<p>${L==='en'?'What to do, when to go and local tips — then get a personalized plan on WhatsApp.':'Qué hacer, cuándo ir y tips locales — luego recibe un plan personalizado por WhatsApp.'}</p>
${sections}
</div></body></html>`;
}

// ---- write ----
const dEN = path.join(OUT,'en','destinations'), dES = path.join(OUT,'destinos');
fs.rmSync(dEN,{recursive:true,force:true}); fs.rmSync(dES,{recursive:true,force:true});
fs.mkdirSync(dEN,{recursive:true}); fs.mkdirSync(dES,{recursive:true});
const slugs=[];
for(const d of dests){
  fs.writeFileSync(path.join(dES,d.slug+'.html'), page(d,dests,'es'));
  fs.writeFileSync(path.join(dEN,d.slug+'.html'), page(d,dests,'en'));
  slugs.push(d.slug);
}
fs.writeFileSync(path.join(dES,'index.html'), hub(dests,'es'));
fs.writeFileSync(path.join(dEN,'index.html'), hub(dests,'en'));

const today = new Date().toISOString().slice(0,10);
const entry=(loc,en,es)=>`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n    <xhtml:link rel="alternate" hreflang="es" href="${es}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>\n  </url>`;
let sm=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
sm+=entry(`${DOMAIN}${L10N.es.dir}`,`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.es.dir}`)+'\n';
sm+=entry(`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.en.dir}`,`${DOMAIN}${L10N.es.dir}`)+'\n';
for(const s of slugs){
  const en=`${DOMAIN}${L10N.en.dir}${s}.html`, es=`${DOMAIN}${L10N.es.dir}${s}.html`;
  sm+=entry(es,en,es)+'\n'; sm+=entry(en,en,es)+'\n';
}
sm+=`</urlset>\n`;
fs.writeFileSync(path.join(OUT,'sitemap-destinos.xml'), sm);
fs.writeFileSync(path.join(OUT,'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap-destinos.xml\nSitemap: ${DOMAIN}/sitemap-itinerarios.xml\n`);

console.log('Generated', dests.length, 'destinations ->', dests.length*2, 'pages + 2 hubs + sitemap + robots into', OUT);
