# SEO page generator — TripSensei (destinos)

Genera páginas estáticas bilingües (ES + EN) de "qué hacer en {destino}" desde
`destinations.json`, más `sitemap-destinos.xml` y `robots.txt`. Forkeado del
generador de CalorIA Scan. Cada página funnelea a WhatsApp con texto pre-llenado.
Cero dependencias (Node 18+).

## Archivos
- `destinations.json` — el dataset/backlog. Un objeto por destino. **Aquí escalas.**
- `generate.js` — renderiza `destinations.json` → HTML + sitemap + robots.

## Estructura de URLs
- ES: `/destinos/{slug}.html`   ·  hub `/destinos/`
- EN: `/en/destinations/{slug}.html`  ·  hub `/en/destinations/`

## Generar
```bash
node seo/generate.js build     # preview en ./build
node seo/generate.js .         # escribe en la raíz del sitio (deploy)
```

## Antes de hacer deploy
1. Ajusta `DOMAIN` y `WA` (número de WhatsApp) en la cabecera de `generate.js`.
2. Corre `node seo/generate.js .`
3. Si ya tienes un `sitemap.xml`, fusiona o referencia `sitemap-destinos.xml`.
4. Agrega un link en el nav/footer del landing a `/destinos/` (ES) y `/en/destinations/` (EN)
   para que Google encuentre el hub.
5. Sube `sitemap-destinos.xml` en Google Search Console.

## Agregar destinos (el backlog)
Añade un objeto a `destinations.json` con estos campos y re-genera:

```jsonc
{
  "slug":"medellin",                 // url-safe, sin acentos
  "name":"Medellín", "en_name":"Medellín",
  "country_es":"Colombia", "country_en":"Colombia",
  "flag":"🇨🇴",
  "cluster":"sudamerica",            // mexico | sudamerica | usa  (agrupa related + hub)
  "days":"3–4",
  "best_es":"…", "best_en":"…",      // mejor época
  "intro_es":"…", "intro_en":"…",    // 2 frases
  "things":[                          // 3–4 cosas que hacer
    {"t_es":"…","t_en":"…","d_es":"…","d_en":"…"}
  ],
  "tip_es":"…", "tip_en":"…"          // tip de local (la propuesta de valor de TripSensei)
}
```

## Cómo escalar el contenido (sin escribirlo a mano)
El campo de mayor volumen de búsqueda es la entidad = ciudad/destino. Para llenar
`things`/`tip`/`intro` a escala, pásale a Claude API un prompt con el destino y que
devuelva el objeto JSON ya formado. Lo pegas al array y re-generas. Misma data, cero
costo de suscripción.

## Notas
- `cluster` controla el interlinking "Otros destinos" y las secciones del hub.
- El schema incluye BreadcrumbList + TouristDestination + FAQPage (rich results).
- Validado: divs balanceados, JSON-LD, canonical y hreflang ES/EN en las 24 páginas.

---

# Generador de itinerarios (`generate-itineraries.js`)

Segundo generador, mismo patrón, mayor intención de búsqueda. Crea páginas
"Itinerario de N días en {ciudad}" / "{N}-day itinerary in {city}" para 3, 5 y 7
días por destino. Mayor conversión a WhatsApp porque la intención es más caliente
("ya voy, necesito el plan") vs. la página de destino ("estoy investigando").

## Archivos
- `itineraries.json` — planes día por día por destino (3/5/7 días). **Tu backlog.**
- `generate-itineraries.js` — renderiza HTML + sitemap. Lee `destinations.json` para
  metadata compartida (nombre, bandera, país).

## Estructura de URLs
- ES: `/itinerarios/{slug}-{N}-dias.html` (e.g. `/itinerarios/cancun-5-dias.html`)
- EN: `/en/itineraries/{slug}-{N}-days.html`
- Hubs: `/itinerarios/` y `/en/itineraries/`
- Sitemap: `/sitemap-itinerarios.xml`

## Generar
```bash
node seo/generate-itineraries.js build-itin   # preview en ./build-itin
node seo/generate-itineraries.js .            # deploy en la raíz
```

## Dataset semilla
Arrancamos con los 4 destinos USA→México de mayor intención: Cancún, Tulum, CDMX
y Oaxaca, cada uno con 3/5/7 días = 12 itinerarios × 2 idiomas = **24 páginas**.
Mismo volumen que destinos, pero la intención es más caliente y el funnel a
WhatsApp ("personalízalo según tus fechas") es más directo que en destinos
("infórmate").

## Cómo escalar a más ciudades
Añade una entrada a `itineraries.json` con esta forma:

```jsonc
{
  "medellin": {                                // slug debe existir también en destinations.json
    "3": {
      "title_es": "...", "title_en": "...",
      "intro_es": "...", "intro_en": "...",
      "days": [                                // N entradas para N días
        {
          "label_es":"Día 1 — ...", "label_en":"Day 1 — ...",
          "morning_es":"...",   "morning_en":"...",
          "afternoon_es":"...", "afternoon_en":"...",
          "evening_es":"...",   "evening_en":"..."
        }
      ],
      "pro_tip_es":"...", "pro_tip_en":"..."
    },
    "5": { ... },
    "7": { ... }
  }
}
```

Para escalar sin escribir a mano: pásale a Claude API el destino + el slot
(`3`/`5`/`7`) y deja que devuelva el objeto JSON. Mismo patrón que destinos.

## Diferencias vs. el generador de destinos
- **Schema:** usa `TouristTrip` con `itinerary[]` (en vez de `TouristDestination`),
  apto para rich results de tipo "trip plan".
- **CTA WhatsApp:** pre-llenado con "personaliza el itinerario de N días" (más
  específico que "tips para X").
- **Interlinking:** cada página linkea a (a) las otras duraciones de la misma
  ciudad, (b) la misma duración en otras ciudades, y (c) la guía de destino.
- **Layout:** cada día tiene segmentos Mañana/Tarde/Noche con etiqueta lateral
  estilo timeline, no las tarjetas de "cosas que hacer" del generador de destinos.

## Antes de hacer deploy
1. Confirma que `DOMAIN` y `WA` coinciden con los del generador de destinos.
2. Corre `node seo/generate-itineraries.js .`
3. Agrega `Sitemap: https://tripsensei.com/sitemap-itinerarios.xml` a tu `robots.txt`
   (no lo sobrescribimos para no chocar con el sitemap de destinos).
4. Agrega un link en el nav/footer a `/itinerarios/` (ES) y `/en/itineraries/` (EN).
5. Sube `sitemap-itinerarios.xml` en Google Search Console.
