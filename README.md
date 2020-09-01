![logo](img/logo/logo.svg)

This is the source code for my personal website located at https://florinungur.com.

The JavaScript code follows the [Google JavaScript Style Guide
](https://web.archive.org/web/20200707211921/https://google.github.io/styleguide/jsguide.html); save for the column line length, which is 120.

The HTML and CSS code follows the [Google HTML/CSS Style Guide
](https://web.archive.org/web/20200626172027/https://google.github.io/styleguide/htmlcssguide.html); the column line length is again 120.

All files are formatted using [Prettier](https://github.com/prettier/prettier-vscode) and [ESLint](https://github.com/eslint/eslint).

To have the same styling in local development:

1. Install npm from https://www.npmjs.com/get-npm
2. Install ESLint: `npm install --save-dev eslint`
3. Install Prettier: `npm install --save-dev prettier`
4. [Integrate Prettier with ESLint](https://web.archive.org/web/20200523074325/https://prettier.io/docs/en/integrating-with-linters.html): `npm install --save-dev eslint-config-prettier eslint-plugin-prettier`
5. Install the [ESLint shareable config](https://github.com/google/eslint-config-google) for the Google JavaScript style guide (ES2015+ version): `npm install --save-dev eslint eslint-config-google`
6. Use (or modify) [.editorconfig](.editorconfig), [.eslintrc](.eslintrc), and [.prettierrc](.prettierrc)