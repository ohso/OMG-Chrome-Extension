// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { FEED_URL } from './constants.js';
import Storage from './storage.js';

export async function fetchArticles() {
  try {
    const res = await fetch(FEED_URL);
    const json = await res.json();

    const existing = await Storage.articles;

    Storage.articles = json.map(a => {
      const existingArticle = existing.find(e => e.id === a.id);

      const thumbnail = a._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.thumbnail?.source_url || null;

      return ({
        date: a.date_gmt,
        id: a.id,
        link: a.link,
        title: a.title.rendered,
        unread: existingArticle?.unread ?? true,
        thumbnail,
      });
    }).sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
  } catch (e) {
    console.error('Error while fetching articles', e);
  }
}

const ENTITIES = [
  ['&amp;', '&'],
  ['&#038;', '&'],
  ['&quot;', '"'],
  ['&#8220;', '"'],
  ['&#8221;', '"'],
  ['&#8216;', "'"],
  ['&#8217;', "'"],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&nbsp;', ' '],
  ['&ndash;', '-'],
  ['&mdash;', '-'],
  ['&#8211;', '-'],
  ['&#8212;', '-'],
];

/**
 * WP returns titles with HTML entities encoded. This function uses an allowlist of common entities
 * to replace for notifications. It is not exhaustive but contains the most common entities.
 * @param {string} value The original string to decode
 * @returns {string} Returns a decoded string with HTML entities decoded
 */
export function decodeHtmlEntities(value) {
  return ENTITIES.reduce((acc, [entity, char]) => {
    return acc.replaceAll(entity, char);
  }, value);
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function markAsRead(id) {
  const articles = await Storage.articles;
  articles.some(a => {
    if (a.id === id) {
      a.unread = false;
      return true;
    }
    return false;
  });
  Storage.articles = articles;
}

export async function markAllAsRead() {
  const articles = await Storage.articles;
  articles.forEach(a => {
    a.unread = false;
  });
  Storage.articles = articles;
}
