/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import * as fs from 'fs';
import makeDir from 'make-dir';
import * as path from 'path';
import * as tmp from 'tmp';

export interface FixturesWithPermission {
  content: string | Fixtures;
  mode: string | number;
}

function isFixturesWithPermission(
  // tslint:disable-next-line: no-any
  contents: any
): contents is FixturesWithPermission {
  return 'mode' in contents;
}

export interface Fixtures {
  // If string, we create a file with that string contents. If fixture, we
  // create a subdirectory and recursively install the fixture.
  // TODO: support buffers to allow non-text files.
  [name: string]: string | Fixtures | FixturesWithPermission;
}

export async function setupFixtures(
  dir: string,
  fixtures: Fixtures
): Promise<string[]> {
  const keys = Object.keys(fixtures);
  for (const key of keys) {
    const filePath = path.join(dir, key);
    const contents: string | Fixtures | FixturesWithPermission = fixtures[key];

    if (typeof contents === 'string') {
      await fs.writeFileSync(filePath, contents);
    } else if (isFixturesWithPermission(contents)) {
      const unaccessibleFixtures = await setupFixtures(dir, {
        [key]: contents.content,
      });
      fs.chmodSync(filePath, contents.mode);
      unaccessibleFixtures.unshift(filePath);
      return unaccessibleFixtures;
    } else {
      await makeDir(filePath);
      const fixture = fixtures[key] as Fixtures;
      return setupFixtures(filePath, fixture);
    }
  }
  return [];
}

export async function withFixtures(
  fixtures: Fixtures,
  fn: (fixturesDir: string) => PromiseLike<void>
) {
  const keep = !!process.env.INLINE_FIXTURES_KEEP;
  const dir = tmp.dirSync({ keep, unsafeCleanup: true });

  const unaccessibleFixtures = await setupFixtures(dir.name, fixtures);

  const origDir = process.cwd();
  process.chdir(dir.name);

  try {
    return await fn(dir.name);
  } finally {
    unaccessibleFixtures.forEach((filePath: string) =>
      fs.chmodSync(filePath, 0o777)
    );
    process.chdir(origDir);
    if (!keep) {
      dir.removeCallback();
    }
  }
}
