# Pullwise

Qué sobre abrir en Pokémon TCG Pocket para terminar el mazo que estás armando.

## El problema

Los trackers que existen te piden cargar tu colección — 3.879 cartas — antes de
servir para algo. Nadie hace eso. Y no se puede automatizar: **The Pokémon Company
y DeNA no exponen ninguna API de la cuenta del juego**, así que no hay forma de
importar lo que tenés (los trackers que dicen "sincronizar" usan OCR de capturas).

Pullwise da vuelta el modelo: **el universo de trabajo es el mazo, no la colección**.
Armás un mazo de 20 cartas, marcás las pocas que te faltan, y la app calcula qué
sobre conviene abrir y cuántos vas a necesitar.

Una carta que nunca tocaste queda **desconocida**, que no es lo mismo que "no la
tengo". La app nunca te pide completar nada; tu colección crece sola como
subproducto de armar mazos.

## Correr

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # genera ~3.900 páginas estáticas en unos 10 s
pnpm test         # matemática de sobres + parser de listas
pnpm typecheck
pnpm sync:data    # rebajar el dataset cuando sale un set nuevo
```

## Arquitectura

Next 16 (App Router) sobre React 19 y Tailwind 4. La división es simple:

- **Estático y público** — una página por carta (3.879), por set (23) y por sobre (29).
  Se generan en el build y existen para ser encontradas en Google: cada carta es una
  búsqueda real ("*pikachu ex which pack*"). Ahí se calcula la probabilidad de forma
  analítica: para una carta sola la espera es una geométrica, así que la media es 1/p
  y no hace falta simular nada.
- **Interactivo y privado** — la app de mazos, enteramente en el cliente. Tu colección
  no sale de tu navegador.

El dominio (`src/lib/`, ~825 líneas) no importa React: la matemática, las reglas del
mazo y el parser de listas corren igual en el servidor, en el cliente y en los tests.

## Cómo se calcula

Un sobre tiene 5 slots independientes. Cada slot sortea una rareza según su propia
tabla y después una carta uniforme entre las de esa rareza que ese sobre puede dar:

```
P(slot i entregue la carta c) = rate(i, rareza(c)) / pool(set, sobre, rareza(c))
```

Todo se promedia entre las dos variantes de sobre (la común y el *rare pack* del
0,05%) ponderando por su frecuencia. De ahí salen las tres cifras de la interfaz:

- **Chance de carta útil** — `1 − Π(1 − p_slot)`, la probabilidad de que un sobre
  traiga al menos una de las que te faltan. Es la que se muestra grande porque es
  la que se entiende sin explicación.
- **Copias útiles por sobre** — la esperanza. Sobrecuenta de forma marginal cuando
  un sobre da más copias de las que necesitás; no altera el orden del ranking.
- **Sobres hasta completarlo** — Monte Carlo de 400 corridas que abre siempre el
  mejor sobre para lo que falte *en ese momento*. Es el único de los tres que
  modela bien que de una carta te falten dos copias.

La simulación se siembra con un hash de lo que falta, así el mismo mazo devuelve
siempre el mismo número: una estimación que baila entre recargas no se puede creer.

## Datos

[`flibustier/pokemon-tcg-pocket-database`](https://github.com/flibustier/pokemon-tcg-pocket-database)
(MIT). `pnpm sync:data` lo baja y versiona el resultado en `src/data/`, así la app
no depende del CDN en runtime. Imágenes desde el CDN de Limitless.

El script resuelve tres cosas que la fuente trae rotas y que conviene saber si lo
tocás:

- `cards.extra.json` (la metadata de deckbuilding) está **incompleto**: le faltan
  ~1.300 cartas. Se mergea sobre `cards.min.json`, que sí tiene el catálogo entero.
- Los **sets nuevos no traen pull rates**. Heredan los del set anterior de igual
  formato (`B4←B3`, `B4a←B3a`) y la interfaz los marca como *estimado*.
- `sets.json` y `cards.json` se contradicen sobre qué sobres tiene `B4a`. Mandan
  las cartas.

## Lo que no hace

- **No sincroniza con tu cuenta del juego.** No existe forma de hacerlo.
- Las imágenes y los nombres **sólo están en inglés**: el CDN no publica otros idiomas.
- La validación de líneas evolutivas es *best-effort*. El dataset no tiene metadata
  para ~700 cartas de los sets más nuevos; de esas, la app avisa que no puede opinar
  en vez de acusar en falso.
- El estado vive en `localStorage`, sin cuentas ni sincronización entre dispositivos
  (eso sería v2). Por eso hay **Exportar / Importar** en el encabezado: usalo, que
  `localStorage` se borra solo. Entre pestañas del mismo navegador sí se sincroniza.
