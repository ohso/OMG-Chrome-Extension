// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

import Storage from '../src/storage.js';
import {
  ARTICLES_KEY,
  COMPAT_ARTICLES,
  COMPAT_LAST_NOTIFICATION,
  FETCH_ALARM,
  HOME_URL,
  POLL_INTERVAL,
} from '../src/constants.js';
import { fetchArticles, markAllAsRead, markAsRead } from '../src/articles.js';
import { notifyUnread, updateBadge } from '../src/notifications.js';

chrome.runtime.onMessage.addListener((message) => {
  if (!message?.type) return;
  switch (message.type) {
    case COMPAT_LAST_NOTIFICATION:
      Storage.lastNotification = message.value;
      break;
    case COMPAT_ARTICLES:
      Storage.articles = message.value;
      notifyUnread();
      break;
  }
});

chrome.storage.sync.onChanged.addListener((changes) => {
  Object.keys(changes).forEach(key => {
    switch (key) {
      case ARTICLES_KEY:
        updateBadge();
        break;
    }
  });
});

chrome.notifications.onClicked.addListener(async id => {
  const lastNotification = await Storage.lastNotification;
  if (lastNotification?.type === 'single' && lastNotification.article?.link) {
    markAsRead(lastNotification.article.id);
    chrome.tabs.create({ url: lastNotification.article.link });
  } else {
    markAllAsRead();
    chrome.tabs.create({ url: HOME_URL });
  }
});

chrome.notifications.onButtonClicked.addListener(async (id, idx) => {
  const lastNotification = await Storage.lastNotification;
  if (lastNotification?.type === 'single' && lastNotification.article?.link) {
    markAsRead(lastNotification.article.id);
    if (idx === 0) chrome.tabs.create({ url: lastNotification.article.link });
  } else {
    markAllAsRead();
    if (idx ===0) chrome.tabs.create({ url: HOME_URL });
  }
});

async function checkAlarm() {
  const alarm = await chrome.alarms.get(FETCH_ALARM);
  if (!alarm || alarm.periodInMinutes !== POLL_INTERVAL) {
    chrome.alarms.create(FETCH_ALARM, {
      when: Date.now(),
      periodInMinutes: POLL_INTERVAL,
    });
  }
}

async function updateArticles() {
  await fetchArticles();
  await updateBadge();
  await notifyUnread();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FETCH_ALARM) {
    updateArticles();
  }
});

chrome.tabs.onUpdated.addListener(() => {
  updateBadge();
});

checkAlarm();

Storage.onInit().then(updateArticles);
