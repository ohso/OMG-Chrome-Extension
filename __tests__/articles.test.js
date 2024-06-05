// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  fetchArticles,
  markAsRead,
  markAllAsRead,
  decodeHtmlEntities,
} from '../extension/src/articles.js';
import { mockArticles, mockResponse } from '../mock.js';
import { ARTICLES_KEY } from '../extension/src/constants.js';

describe('articles', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => mockResponse,
    });
    jest.spyOn(global.chrome.storage.sync, 'get').mockResolvedValue(Promise.resolve({}));
    jest.spyOn(global.chrome.storage.sync, 'set').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchArticles', () => {
    it('should fetch and store all articles on first run', async () => {
      await fetchArticles();

      expect(global.chrome.storage.sync.set.mock.calls).toMatchSnapshot();
    });

    it('should merge new articles with existing articles', async () => {
      jest.spyOn(global.chrome.storage.sync, 'get').mockResolvedValue(Promise.resolve({ [ARTICLES_KEY]: mockArticles }));

      await fetchArticles();

      expect(global.chrome.storage.sync.set.mock.calls).toMatchSnapshot();
    });

    it('should handle missing thumbnails', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        json: () => [{
          ...mockResponse[0],
          _embedded: {},
        }],
      });
      jest.spyOn(global.chrome.storage.sync, 'get').mockResolvedValue(Promise.resolve({}));

      await fetchArticles();

      expect(global.chrome.storage.sync.set.mock.calls).toMatchSnapshot();
    });

    it('should gracefully handle network failures', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      expect(fetchArticles()).resolves.not.toThrow();
    });
  });

  describe('markAsRead', () => {
    it('should mark a single found article as read', async () => {
      jest.spyOn(global.chrome.storage.sync, 'get').mockResolvedValue(Promise.resolve({
        [ARTICLES_KEY]: mockArticles.map(a => ({
          ...a,
          unread: true,
        })),
      }));

      await markAsRead(mockArticles[1].id);

      expect(global.chrome.storage.sync.set.mock.calls[0][0].articles.map((a) => a.unread)).toMatchInlineSnapshot(`
        [
          true,
          false,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ]
      `);
    });

    it('should handle no found articles', async () => {
      expect(markAsRead(1234)).resolves.not.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all articles as read', async () => {
      jest.spyOn(global.chrome.storage.sync, 'get').mockResolvedValue(Promise.resolve({
        [ARTICLES_KEY]: mockArticles.map(a => ({
          ...a,
          unread: true,
        })),
      }));

      await markAllAsRead();

      expect(global.chrome.storage.sync.set.mock.calls[0][0].articles.every(a => !a.unread)).toBe(true);
    });
  });

  describe('decodeHtmlEntities', () => {
    it.each([
      ['&amp;', '&'],
      ['&quot;', '"'],
      ['&apos;', '\''],
      ['&lt;', '<'],
      ['&gt;', '>'],
      [
        'IBM&#8217;s Iconic Model-M Keyboard Reimagined by 8BitDo"',
        'IBM\'s Iconic Model-M Keyboard Reimagined by 8BitDo"'],
      [
        'Track Time Differently with &#8216;Day Progress&#8217; for GNOME Shell',
        'Track Time Differently with \'Day Progress\' for GNOME Shell',
      ],
      [
        'Microsoft 365 Account Issues in Ubuntu 24.04? Here&#8217;s a Fix',
        'Microsoft 365 Account Issues in Ubuntu 24.04? Here\'s a Fix',
      ],
      [
        'VMware Workstation Pro Now Free to Use on Linux &amp; Windows',
        'VMware Workstation Pro Now Free to Use on Linux & Windows',
      ],
      [
        'Linux Kernel 6.9 Released — And It&#8217;s Packed with Improvements',
        'Linux Kernel 6.9 Released — And It\'s Packed with Improvements',
      ],
      [
        'Google&#8217;s Flutter Team Layoffs Leave Ubuntu Devs in a Flap',
        'Google\'s Flutter Team Layoffs Leave Ubuntu Devs in a Flap',
      ],
      [
        'Disqus Comments Not Loading? It&#8217;s Not Me Bro, It&#8217;s Firefox',
        'Disqus Comments Not Loading? It\'s Not Me Bro, It\'s Firefox',
      ],
      [
        'Mozilla Devs Adding &#8216;New Tab Wallpapers&#8217; to Firefox',
        'Mozilla Devs Adding \'New Tab Wallpapers\' to Firefox',
      ],
      [
        'VLC Media Player Hits 5 Billion Downloads &#8211; Big Changes Ahead',
        'VLC Media Player Hits 5 Billion Downloads - Big Changes Ahead',
      ],
      [
        'Linux Mint 22: Codename &#038; New Cinnamon Feature Revealed',
        'Linux Mint 22: Codename & New Cinnamon Feature Revealed',
      ],
      [
        'KDE Wallpaper Competition Kicks-Off  &#8211; Win a 13-inch Framework Laptop',
        'KDE Wallpaper Competition Kicks-Off  - Win a 13-inch Framework Laptop',
      ],
      [
        'Fix &#8220;Target Configured Multiple Times&#8221; Error on Ubuntu',
        'Fix "Target Configured Multiple Times" Error on Ubuntu',
      ],
      [
        '&#8216;Burn My Windows&#8217; &#038; &#8216;Desktop Clock&#8217; GNOME Extensions Updated',
        '\'Burn My Windows\' & \'Desktop Clock\' GNOME Extensions Updated',
      ],
    ])('should decode %s correctly', (entity, expected) => {
      expect(decodeHtmlEntities(entity)).toBe(expected);
    });
  });
});
