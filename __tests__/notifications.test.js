// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { jest, expect, describe, it, afterEach, beforeEach } from '@jest/globals';
import {
  activeIconUrl,
  clear,
  inactiveIconUrl,
  multi, notifyUnread,
  single,
  updateBadge,
} from '../extension/src/notifications.js';
import { ARTICLES_KEY, LAST_NOTIFICATION_KEY } from '../extension/src/constants.js';
import { mockArticles } from '../mock.js';

describe('notifications', () => {
  beforeEach(() => {
    jest.spyOn(chrome.storage.sync, 'get').mockReturnValue(Promise.resolve({}));
    jest.spyOn(chrome.storage.sync, 'set').mockImplementation(jest.fn());
    jest.spyOn(chrome.notifications, 'clear').mockImplementation(jest.fn());
    jest.spyOn(chrome.notifications, 'create').mockImplementation(jest.fn());
    jest.spyOn(chrome.action, 'setBadgeText').mockImplementation(jest.fn());
    jest.spyOn(chrome.action, 'setIcon').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should trigger a single article notification with a thumbnail', async () => {
    await single(mockArticles[1]);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [LAST_NOTIFICATION_KEY]: {
        type: 'single',
        lastId: mockArticles[1].id,
        article: mockArticles[1],
      },
    });
    expect(chrome.notifications.clear).toHaveBeenCalled();
    expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "omg",
          {
            "buttons": [
              {
                "title": "Read",
              },
              {
                "title": "Mark As Read",
              },
            ],
            "iconUrl": "file://only-a-test/images/icon_logo128.png",
            "imageUrl": "https://www.omgubuntu.co.uk/wp-content/uploads/2024/05/windows-tux-thumbnail-350x200.jpg",
            "message": "Microsoft Announce WSL Updates, Including New Settings App",
            "title": "New article on OMG! Ubuntu!",
            "type": "image",
          },
        ],
      ]
    `);
  });

  it('should trigger a single article notification without a thumbnail', async () => {
    const noThumbnail = {
      ...mockArticles[1],
      thumbnail: null,
    };
    await single(noThumbnail);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [LAST_NOTIFICATION_KEY]: {
        type: 'single',
        lastId: mockArticles[1].id,
        article: noThumbnail,
      },
    });
    expect(chrome.notifications.clear).toHaveBeenCalled();
    expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "omg",
          {
            "buttons": [
              {
                "title": "Read",
              },
              {
                "title": "Mark As Read",
              },
            ],
            "iconUrl": "file://only-a-test/images/icon_logo128.png",
            "message": "Microsoft Announce WSL Updates, Including New Settings App",
            "title": "New article on OMG! Ubuntu!",
            "type": "basic",
          },
        ],
      ]
    `);
  });

  it('should trigger a multiple article notification', async () => {
    await multi(mockArticles);
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [LAST_NOTIFICATION_KEY]: {
        type: 'multi',
        lastId: mockArticles[0].id,
      },
    });
    expect(chrome.notifications.clear).toHaveBeenCalled();
    expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "omg",
          {
            "buttons": [
              {
                "title": "Read",
              },
              {
                "title": "Mark All As Read",
              },
            ],
            "iconUrl": "file://only-a-test/images/icon_logo128.png",
            "message": ""New App Makes Converting Text Documents on Ubuntu Easier" and 10 other articles",
            "title": "11 new articles on OMG! Ubuntu!",
            "type": "basic",
          },
        ],
      ]
    `);
  });

  it('should trigger a multiple article notification with only two articles', async () => {
    await multi(mockArticles.slice(0, 2));
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [LAST_NOTIFICATION_KEY]: {
        type: 'multi',
        lastId: mockArticles[0].id,
      },
    });
    expect(chrome.notifications.clear).toHaveBeenCalled();
    expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "omg",
          {
            "buttons": [
              {
                "title": "Read",
              },
              {
                "title": "Mark All As Read",
              },
            ],
            "iconUrl": "file://only-a-test/images/icon_logo128.png",
            "message": ""New App Makes Converting Text Documents on Ubuntu Easier" and 1 other article",
            "title": "2 new articles on OMG! Ubuntu!",
            "type": "basic",
          },
        ],
      ]
    `);
  });

  it('should clear all notifications', async () => {
    await clear();
    expect(chrome.notifications.clear).toHaveBeenCalled();
  });

  describe('updateBadge', () => {
    it('should show a badge when there are unread articles', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockReturnValue(Promise.resolve({
        [ARTICLES_KEY]: mockArticles.map(a => ({
          ...a,
          unread: true,
        })),
      }));

      await updateBadge();
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: `${mockArticles.length}` });
      expect(chrome.action.setIcon).toHaveBeenCalledWith({ path: activeIconUrl });
    });

    it('should not show a badge when there are no unread articles', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockReturnValue(Promise.resolve({
        [ARTICLES_KEY]: mockArticles.map(a => ({
          ...a,
          unread: false,
        })),
      }));

      await updateBadge();
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(chrome.action.setIcon).toHaveBeenCalledWith({ path: inactiveIconUrl });
    });
  });

  describe('notifyUnread', () => {
    it('should notify for all unread articles when no previous notification', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockImplementation((key) => {
        switch (key) {
          case ARTICLES_KEY:
            return Promise.resolve({
              [ARTICLES_KEY]: mockArticles.map(a => ({
                ...a,
                unread: true,
              })),
            });
          default:
            return Promise.resolve({});
        }
      });
      await notifyUnread();
      expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "omg",
            {
              "buttons": [
                {
                  "title": "Read",
                },
                {
                  "title": "Mark All As Read",
                },
              ],
              "iconUrl": "file://only-a-test/images/icon_logo128.png",
              "message": ""New App Makes Converting Text Documents on Ubuntu Easier" and 10 other articles",
              "title": "11 new articles on OMG! Ubuntu!",
              "type": "basic",
            },
          ],
        ]
      `);
    });

    it('should only notify for a single unread article since the last notification', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockImplementation((key) => {
        switch (key) {
          case ARTICLES_KEY:
            return Promise.resolve({
              [ARTICLES_KEY]: mockArticles.map(a => ({
                ...a,
                unread: true,
              })),
            });
            case LAST_NOTIFICATION_KEY:
              return Promise.resolve({
                [LAST_NOTIFICATION_KEY]: {
                  type: 'single',
                  lastId: mockArticles[1].id,
                },
              });
          default:
            return Promise.resolve({});
        }
      });
      await notifyUnread();
      expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "omg",
            {
              "buttons": [
                {
                  "title": "Read",
                },
                {
                  "title": "Mark As Read",
                },
              ],
              "iconUrl": "file://only-a-test/images/icon_logo128.png",
              "message": "New App Makes Converting Text Documents on Ubuntu Easier",
              "title": "New article on OMG! Ubuntu!",
              "type": "basic",
            },
          ],
        ]
      `);
    });

    it('should only notify for unread articles since the last notification', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockImplementation((key) => {
        switch (key) {
          case ARTICLES_KEY:
            return Promise.resolve({
              [ARTICLES_KEY]: mockArticles.map(a => ({
                ...a,
                unread: true,
              })),
            });
          case LAST_NOTIFICATION_KEY:
            return Promise.resolve({
              [LAST_NOTIFICATION_KEY]: {
                type: 'single',
                lastId: mockArticles[2].id,
              },
            });
          default:
            return Promise.resolve({});
        }
      });
      await notifyUnread();
      expect(chrome.notifications.create.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "omg",
            {
              "buttons": [
                {
                  "title": "Read",
                },
                {
                  "title": "Mark All As Read",
                },
              ],
              "iconUrl": "file://only-a-test/images/icon_logo128.png",
              "message": ""New App Makes Converting Text Documents on Ubuntu Easier" and 1 other article",
              "title": "2 new articles on OMG! Ubuntu!",
              "type": "basic",
            },
          ],
        ]
      `);
    });

    it('should not notify if there are no unread articles', async () => {
      jest.spyOn(chrome.storage.sync, 'get').mockImplementation((key) => {
        switch (key) {
          case ARTICLES_KEY:
            return Promise.resolve({
              [ARTICLES_KEY]: mockArticles.map(a => ({
                ...a,
                unread: false,
              })),
            });
          default:
            return Promise.resolve({});
        }
      });
      await notifyUnread();
      expect(chrome.notifications.create).not.toHaveBeenCalled();
    });
  });
});
