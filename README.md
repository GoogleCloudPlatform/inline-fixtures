<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# inline-fixtures

[![NPM Version](https://img.shields.io/npm/v/inline-fixtures.svg)](https://npmjs.org/package/inline-fixtures)
[![Build Status](https://github.com/GoogleCloudPlatform/inline-fixtures/workflows/ci/badge.svg)](https://github.com/GoogleCloudPlatform/inline-fixtures/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/GoogleCloudPlatform/inline-fixtures/badge.svg?targetFile=package.json)](https://snyk.io/test/github/GoogleCloudPlatform/inline-fixtures?targetFile=package.json)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Sometimes tests need fixture directories. [Observe](https://github.com/nodejs/node/blob/d3fb7e1b3658a6f00e1c631aa551f2ea0ab81f5e/test/parallel/test-require-dot.js):

```js
const a = require(path.join('module-require', 'relative', 'dot.js'));
const b = require(path.join('module-require', 'relative', 'dot-slash.js'));
//...
```

At this point it is not clear what the fixture files themselves actually do, or how the rest of the test file relates to them. One must have both the fixtures and the test open together to actually understand the test.

It would be nice if the fixtures were inline, next to the test source code.

`inline-fixtures` dynamically creates a temporary directory and populates it with the fixture
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
## Supported Node.js Versions
Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/). Libraries are compatible with all current _active_ and _maintenance_ versions of Node.js.

## License
[Apache-2.0](LICENSE)

---
Made with ❤️ by the Google Node.js team.

> ***NOTE: This is not an official Google product.***

