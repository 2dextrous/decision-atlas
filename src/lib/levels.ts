import type { CollectionEntry } from 'astro:content';

type Minutes = CollectionEntry<'stations'>['data']['minutes'];

/** How many depth levels a stop has written: 1 (gist), 2 (+ how it works) or 3 (+ deep dive). */
export const levelCount = (m: Minutes) => 1 + (m.how ? 1 : 0) + (m.deep ? 1 : 0);

/** Reading time for everything written so far, in minutes. */
export const totalMinutes = (m: Minutes) => m.gist + (m.how ?? 0) + (m.deep ?? 0);

/** slug → number of written levels, for the map and line pages. */
export const levelMap = (entries: CollectionEntry<'stations'>[]) =>
  new Map(entries.map((e) => [e.id, levelCount(e.data.minutes)]));
