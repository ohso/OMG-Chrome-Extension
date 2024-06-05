// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { TITLE } from './constants.js';
import Storage from './storage.js';
import { decodeHtmlEntities } from './articles.js';

export const ID = 'omg';

const iconUrl = chrome.runtime.getURL('images/icon_logo128.png');
export const inactiveIconUrl = chrome.runtime.getURL('images/icon_inactive38.png');
export const activeIconUrl = chrome.runtime.getURL('images/icon_active38.png');

export async function clear() {
  return chrome.notifications.clear(ID);
}

/**
 * @param {Article} article
 */
export async function single(article) {
  const options = {
    type: 'basic',
    title: `New article on ${TITLE}`,
    message: decodeHtmlEntities(article.title),
    iconUrl,
    buttons: [
      {
        title: 'Read',
      },
      {
        title: 'Mark As Read',
      }
    ],
  };

  if (article.thumbnail) { // Opera doesn't currently support image notifications  w
    options.type = 'image';
    options.imageUrl = article.thumbnail;
  }

  const lastId = article.id;

  Storage.lastNotification = { type: 'single', lastId, article };
  await clearAll();
  chrome.notifications.create(ID, options);
}

/**
 * @param {Array<Article>} articles
 */
export async function multi(articles) {
  const options = {
    type: 'basic',
    title: `${articles.length} new articles on ${TITLE}`,
    message: `"${decodeHtmlEntities(articles[0].title)}" and ${articles.length - 1} other ${articles.length - 1 === 1 ? 'article' : 'articles'}`,
    iconUrl,
    buttons: [
      {
        title: 'Read',
      },
      {
        title: 'Mark All As Read',
      }
    ],
  };

  const lastId = articles[0].id;

  Storage.lastNotification = {type: 'multi', lastId };
  await clearAll();
  chrome.notifications.create(ID, options);
}

export async function clearAll() {
  return chrome.notifications.clear(ID);
}

export async function updateBadge() {
  const articles = await Storage.articles;
  const unread = articles.filter(a => a.unread).length;

  if (unread) {
    chrome.action.setBadgeText({ text: `${unread}` });
    chrome.action.setIcon({ path: activeIconUrl });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setIcon({ path: inactiveIconUrl });
  }
}

export async function notifyUnread() {
  const articles = await Storage.articles;
  const lastId = (await Storage.lastNotification)?.lastId;
  const lastIndex = articles.findIndex(article => article.id === lastId);
  const unread = articles.slice(0, lastIndex === -1 ? articles.length : lastIndex).filter(a => a.unread);

  if (!unread.length) return;

  if (unread.length > 1) {
    multi(unread);
  } else {
    single(unread[0]);
  }
}
