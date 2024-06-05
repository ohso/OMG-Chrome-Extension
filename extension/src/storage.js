// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import {
  INITIALIZED_KEY,
  ARTICLES_KEY,
  LAST_NOTIFICATION_KEY,
} from './constants.js';
import { createOffscreenCompatDocument } from './offscreen.js';

/**
 * @typedef {Object} Article
 * @property {number} id
 * @property {string} url
 * @property {string} title
 * @property {string} [thumbnail]
 * @property {boolean} unread
 */

export const SCHEMA_VERSION = 1;

class Storage {
  /**
   * For future compatibility upgrades. Right now there's only one initial upgrade so no complex logic.
   * @returns {Promise<void>}
   */
  async onInit() {
    const { [INITIALIZED_KEY]: initialized } = await chrome.storage.sync.get(INITIALIZED_KEY);
    if (initialized !== SCHEMA_VERSION) {
      createOffscreenCompatDocument();
      chrome.storage.sync.set({ [INITIALIZED_KEY]: SCHEMA_VERSION });
    }
  }

  /**
   * @returns {Promise<Array<Article>>}
   */
  get articles() {
    return chrome.storage.sync.get(ARTICLES_KEY).then(({ [ARTICLES_KEY]: value }) => value || []);
  }

  /**
   * @param {Array<Article>} articles
   */
  set articles(articles) {
    chrome.storage.sync.set({ [ARTICLES_KEY]: articles });
  }

  /**
   * @returns {Promise<{ type: 'single'|'multi', lastId: number, article: Article }|undefined>}
   */
  get lastNotification() {
    return chrome.storage.sync.get(LAST_NOTIFICATION_KEY).then(({ [LAST_NOTIFICATION_KEY]: value }) => value);
  }

  /**
   * @param {{ type: 'single'|'multi', lastId: number }} notification
   */
  set lastNotification(notification) {
    chrome.storage.sync.set({ [LAST_NOTIFICATION_KEY]: notification });
  }
}

export default new Storage();
