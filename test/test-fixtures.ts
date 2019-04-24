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
import { setupFixtures, withFixtures, FixtureContent } from '../src/fixtures';

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
        const password = '123456';
        const FIXTURES = {
          'SECRET.key': new FixtureContent(password),
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
        const SUBFIXTURES = {
          'README.md': 'Hello World.',
        };
        const FIXTURES = {
          private: new FixtureContent(SUBFIXTURES),
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
        const DEEPERFIXTURES = {
          'SECRET.key': new FixtureContent('123456'),
        };
        const DEEPFIXTURES = {
          secret: new FixtureContent(DEEPERFIXTURES),
        };
        const FIXTURES = {
          private: new FixtureContent(DEEPFIXTURES),
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

    it('should work with nested mixed directories', async () => {
      const dir = tmp.dirSync({ unsafeCleanup: true });
      try {
        const DEEPERFIXTURES = {
          'SECRET.key': new FixtureContent('123456'),
          'PUBLIC.key': '654321',
        };
        const DEEPFIXTURES = {
          secret: DEEPERFIXTURES,
          anotherDir: {
            'index.js': '42;',
          },
          'anotherfile.js': '99;',
        };
        const FIXTURES = {
          private: new FixtureContent(DEEPFIXTURES, 0o644),
          'README.md': 'Hello World.',
        };
        const unaccessibleFixtures = await setupFixtures(dir.name, FIXTURES);

        // test SECRET.key is unaccessible
        const indexPath = path.join(
          dir.name,
          'private',
          'secret',
          'SECRET.key'
        );
        assert.throws(() => fs.readFileSync(indexPath, 'utf8'));

        // freeing all up and testing accessibility
        unaccessibleFixtures.forEach((filePath: string) => {
          fs.chmodSync(filePath, 0o777);
          assert.doesNotThrow(() => fs.accessSync(filePath));
        });
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

    it('should work with inaccessible assets', async () => {
      const SUBFIXTURES = {
        'README.md': 'Hello World.',
      };
      const FIXTURES = {
        private: new FixtureContent(SUBFIXTURES),
      };
      const origDir = process.cwd();
      let readmePath: string;

      await withFixtures(FIXTURES, async fixturesDir => {
        assert.strictEqual(process.cwd(), fs.realpathSync(fixturesDir));
        readmePath = path.join(fixturesDir, 'private', 'README.md');
        assert.throws(() => fs.readFileSync(readmePath, 'utf8'));
      });
      assert.strict(process.cwd(), origDir);
      // test that the directory is removed
      assert.throws(() => fs.readFileSync(readmePath, 'utf8'));
    });

    it('should cleanup temporary directories');
    it('should keep temporary directories when INLINE_FIXTURES_KEEP is set');
  });
});
