// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

import { COMPAT_LAST_NOTIFICATION, COMPAT_ARTICLES } from '../src/constants.js';

if (localStorage['notification']) {
  chrome.runtime.sendMessage(undefined, {
    type: COMPAT_LAST_NOTIFICATION,
    value: JSON.parse(localStorage['notification']),
  });
}

if (localStorage['articles']) {
  chrome.runtime.sendMessage(undefined, {
    type: COMPAT_ARTICLES,
    value: JSON.parse(localStorage['articles']),
  });
}
