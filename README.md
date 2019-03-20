# inline-fixtures

[![CircleCI](https://circleci.com/gh/ofrobots/inline-fixtures.svg?style=svg)](https://circleci.com/gh/ofrobots/inline-fixtures)

Sometimes tests need fixture directories. It would be nice if the fixtures were inline, next to the test source code. This module helps you do that.
It dynamic creates a temporary directory and populates it with the fixture
layout you provide, and then calls the passed in function. This has the
additional benefit that fixture mutation cannot leak from one test to
another.

Example:

```js
import {withFixtures} from 'inline-fixtures';

describe('tests for fs.readFileSync', () => {
  it('should have a test cases', async () => {
    const FIXTURES = {
      'README.md': 'Hello Mars.',
      anotherDir: {
        'index.js': '42;',
      },
    };
    await withFixtures(FIXTURES, async (fixturesDir) => {
      // A temporary `fixturesDir` exists at this point with `README.md`
      // and `anotherDir`. The latter contains `index.js`.
      const readmePath = path.join(fixturesDir, 'README.md');
      const contents = fs.readFileSync(readmePath, 'utf8');
      assert.strictEqual(contents, FIXTURES['README.md']);     
    });
  });
});
```
