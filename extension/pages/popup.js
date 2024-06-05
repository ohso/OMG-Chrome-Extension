// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

import Storage from '../src/storage.js';
import { fetchArticles, markAllAsRead, markAsRead } from '../src/articles.js';
import { notifyUnread, updateBadge } from '../src/notifications.js';

const placeholderImageUrl = chrome.runtime.getURL('images/thumb_placeholder.jpg');
const unreadImageUrl = chrome.runtime.getURL('images/unread.svg');

const container = document.querySelector('.articles');
const refresh = document.querySelector('.refresh');

function onArticleClick(e) {
  const article = e.target.closest('.article');
  const id = article?.dataset.id;
  const a = e.target.closest('a');
  const button = e.target.closest('.unread');
  const interactive = a || button;
  if (id && interactive) {
    markAsRead(parseInt(id, 10));
  }

  if (button) {
    button.remove();
  }
}

async function updateArticleNodes() {
  const nextNodes = [];

  const articles = await Storage.articles;
  articles.forEach(article => {
    const div = document.createElement('div');
    div.className = 'article';
    div.dataset.id = article.id;

    const unreadIndicator = article.unread
      ? `<button class="unread db link" type="button" title="Mark as read"><img class="db" src="${unreadImageUrl}" /></button>`
      : '';

    div.innerHTML = `
      ${unreadIndicator}
      <a href="${article.link}" target="_blank">
        <img class="db thumbnail" alt="" src="${article.thumbnail || placeholderImageUrl}" />
        <h2>${article.title}</h2>
      </a>
    `;
    nextNodes.push(div);
  });

  container.replaceChildren(...nextNodes);
}

let spinTimeout;

document.querySelector('.articles').addEventListener('click', onArticleClick);
refresh.addEventListener('click', async () => {
  clearTimeout(spinTimeout);
  refresh.classList.add('spin');

  try {
    await fetchArticles();
    await notifyUnread();
    await updateArticleNodes();
  } finally {
    spinTimeout = setTimeout(() => {
      refresh.classList.remove('spin');
    }, 500);
  }
});
document.querySelector('.read-all').addEventListener('click', async () => {
  await markAllAsRead();
  await updateArticleNodes();
});

await updateArticleNodes();
