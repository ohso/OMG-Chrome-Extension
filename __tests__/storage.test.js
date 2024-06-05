// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { afterEach, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('../extension/src/offscreen.js', () => {
  return {
    createOffscreenCompatDocument: jest.fn(),
  };
});

const { default: Storage, SCHEMA_VERSION } = await import('../extension/src/storage.js');
const { createOffscreenCompatDocument } = await import('../extension/src/offscreen.js');

import {
  ARTICLES_KEY,
  INITIALIZED_KEY,
  LAST_NOTIFICATION_KEY,
} from '../extension/src/constants.js';

describe('storage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    { property: 'articles', key: ARTICLES_KEY },
    { property: 'lastNotification', key: LAST_NOTIFICATION_KEY },
  ])('should set and access the key $key for property $property', ({ key, property }) => {
    jest.spyOn(chrome.storage.sync, 'get').mockReturnValue(Promise.resolve({}));
    jest.spyOn(chrome.storage.sync, 'set').mockImplementation(jest.fn());

    Storage[property] = 'test';
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: 'test' });
    Storage[property];
    expect(chrome.storage.sync.get).toHaveBeenCalledWith(key);
  });

  it('should set the schema version on the first run', async () => {
    jest.spyOn(chrome.storage.sync, 'get').mockReturnValue({});
    jest.spyOn(chrome.storage.sync, 'set').mockImplementation(jest.fn());

    await Storage.onInit();
    expect(createOffscreenCompatDocument).toHaveBeenCalled();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [INITIALIZED_KEY]: SCHEMA_VERSION,
    });
  });

  it('should skip compatibility code after the first run', async () => {
    jest.spyOn(chrome.storage.sync, 'get').mockReturnValue({ [INITIALIZED_KEY]: SCHEMA_VERSION });
    jest.spyOn(chrome.storage.sync, 'set').mockImplementation(jest.fn());

    await Storage.onInit();
    expect(createOffscreenCompatDocument).not.toHaveBeenCalled();
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });
});
