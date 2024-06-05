// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

global.chrome = {
  runtime: {
    getURL(path) { return `file://only-a-test/${path}`; },
    getContexts() { throw new Error('TODO'); },
  },
  offscreen: {
    createDocument() { throw new Error('TODO'); },
  },
  storage: {
    sync: {
      get() { throw new Error('TODO'); },
      set() { throw new Error('TODO'); },
    },
  },
  notifications: {
    clear() { throw new Error('TODO'); },
    create() { throw new Error('TODO'); },
  },
  action: {
    setBadgeText() { throw new Error('TODO'); },
    setIcon() { throw new Error('TODO'); },
  },
};

global.fetch = () => { throw new Error('TODO'); };
