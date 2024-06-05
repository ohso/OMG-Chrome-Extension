// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

/** @type {Promise|null} */
let creating;

export async function createOffscreenCompatDocument() {
  const url = chrome.runtime.getURL('offscreen.html');

  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [url],
  });

  if (existing.length) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url,
      reasons: ['LOCAL_STORAGE'],
      justification: 'fetch existing notification settings',
    });

    await creating;
    creating = null;
  }
}
