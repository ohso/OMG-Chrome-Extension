// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran
import { jest, expect, describe, it, afterEach } from '@jest/globals';
import { createOffscreenCompatDocument } from '../extension/src/offscreen.js';

describe('offscreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not create an offscreen document if one exists', async () => {
    jest.spyOn(chrome.runtime, 'getContexts').mockReturnValue([{}]);
    jest.spyOn(chrome.offscreen, 'createDocument').mockImplementation(() => {});
    await createOffscreenCompatDocument();
    expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
  });

  it('should create an offscreen document if one does not exist', async () => {
    jest.spyOn(chrome.runtime, 'getContexts').mockReturnValue([]);
    jest.spyOn(chrome.offscreen, 'createDocument').mockImplementation(() => {});
    await createOffscreenCompatDocument();
    expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
  });

  it('should only create an offscreen document one at a time', async () => {
    jest.spyOn(chrome.runtime, 'getContexts').mockReturnValue([]);
    jest.spyOn(chrome.offscreen, 'createDocument').mockImplementation(() => Promise.resolve({}));
    await Promise.all([
      createOffscreenCompatDocument(),
      createOffscreenCompatDocument(),
    ]);
    expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
  });
});
