// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2024 Sam Tran

/** @type {import('jest').Config} */
const config = {
  verbose: true,
  coverageDirectory: 'coverage',

  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {},
};

export default config;
