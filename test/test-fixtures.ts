/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import {
  setupFixtures,
  withFixtures,
  FixturesWithPermission,
} from '../src/fixtures';

describe(__filename, () => {
  describe('setupFixtures', () => {
    it('should populate directory with the requested entries', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const FIXTURES = {
          'README.md': 'Hello World.',
        };
        await setupFixtures(dir.name, FIXTURES);
        const contents = fs.readFileSync(
          path.join(dir.name, 'README.md'),
          'utf8'
        );
        assert.strictEqual(contents, FIXTURES['README.md']);
      } finally {
        dir.removeCallback();
      }
    });

    it('should work with nested directories', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const FIXTURES = {
          'README.md': 'Hello Mars.',
          anotherDir: {
            'index.js': '42;',
          },
        };
        await setupFixtures(dir.name, FIXTURES);
        const indexPath = path.join(dir.name, 'anotherDir', 'index.js');
        const contents = fs.readFileSync(indexPath, 'utf8');
        assert.strictEqual(contents, FIXTURES.anotherDir['index.js']);
      } finally {
        dir.removeCallback();
      }
    });

    it('should create an unaccessible file', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const FIXTURES = {
          'SECRET.key': {
            mode: 0o000,
            content: '123456',
          },
        };
        await setupFixtures(dir.name, FIXTURES);
        const indexPath = path.join(dir.name, 'SECRET.key');
        assert.throws(() => fs.readFileSync(indexPath, 'utf8'));
      } finally {
        dir.removeCallback();
      }
    });

    it('should create an unaccessible directory', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const FIXTURES = {
          private: {
            mode: 0o000,
            content: {
              'README.md': 'Hello World.',
            },
          },
        };
        const unaccessibleFixtures = await setupFixtures(dir.name, FIXTURES);
        const indexPath = path.join(dir.name, 'private', 'README.md');
        assert.throws(() => fs.readFileSync(indexPath, 'utf8'));
        unaccessibleFixtures.forEach((filePath: string) =>
          fs.chmodSync(filePath, 0o777)
        );
      } finally {
        dir.removeCallback();
      }
    });

    it('should work with nested unaccessible directories', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const FIXTURES = {
          private: {
            mode: 0o000,
            content: {
              secret: {
                mode: 0o000,
                content: {
                  'SECRET.key': {
                    content: {
                      mode: 0o000,
                      content: '123456',
                    },
                  },
                },
              },
            },
          },
        };
        const unaccessibleFixtures = await setupFixtures(dir.name, FIXTURES);
        const indexPath = path.join(
          dir.name,
          'private',
          'secret',
          'SECRET.key'
        );
        assert.throws(() => fs.readFileSync(indexPath, 'utf8'));
        unaccessibleFixtures.forEach((filePath: string) =>
          fs.chmodSync(filePath, 0o777)
        );
      } finally {
        dir.removeCallback();
      }
    });
  });

  describe('withFixtures', () => {
    it('should call the function with fixtures setup', async () => {
      const FIXTURES = {
        'README.md': 'Hello Jupiter.',
      };
      const origDir = process.cwd();
      await withFixtures(FIXTURES, async fixturesDir => {
        assert.strictEqual(process.cwd(), fs.realpathSync(fixturesDir));
        const readmePath = path.join(fixturesDir, 'README.md');
        const contents = fs.readFileSync(readmePath, 'utf8');
        assert.strictEqual(contents, FIXTURES['README.md']);
      });
      assert.strict(process.cwd(), origDir);
    });

    it('should cleanup temporary directories');
    it('should keep temporary directories when INLINE_FIXTURES_KEEP is set');
  });
});
