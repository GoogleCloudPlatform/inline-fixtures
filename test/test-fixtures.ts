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
import { setupFixtures, withFixtures } from '../src/fixtures';

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
