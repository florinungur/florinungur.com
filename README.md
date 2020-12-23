![logo](img/logo/logo-min.svg)

This is the source code for my personal website located at https://florinungur.com.

## Code style
The HTML and CSS code follows the [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html) [[archived link](https://web.archive.org/web/20200626172027/https://google.github.io/styleguide/htmlcssguide.html)]; save for the column line length, which is 160.

I format all files using [Prettier](https://github.com/prettier/prettier-vscode) and [ESLint](https://github.com/eslint/eslint) with the VSCode IDE.

To have the same styling in local development:
1. Install npm from https://www.npmjs.com/get-npm
2. Install ESLint and Prettier: `npm install --save-dev eslint prettier`
3. [Integrate Prettier with ESLint](https://prettier.io/docs/en/integrating-with-linters.html) [[archived link](https://web.archive.org/web/20200523074325/https://prettier.io/docs/en/integrating-with-linters.html)]: `npm install --save-dev eslint-config-prettier eslint-plugin-prettier`
4. Install the [ESLint shareable config](https://github.com/google/eslint-config-google) for the Google JavaScript style guide (ES2015+ version): `npm install --save-dev eslint eslint-config-google`
5. Use (or modify) [.editorconfig](.editorconfig), [.eslintrc](.eslintrc), and [.prettierrc](.prettierrc)

## cssnano
To minify CSS the same way I do:
1. Download the [cssnano](https://cssnano.co/) npm package: `npm install --save-dev cssnano`
2. cssnano also needs a PostCSS runner: `npm install --global postcss postcss-cli`
3. Use (or modify) [postcss.config.js](postcss.config.js)
4. Try it out: `postcss input.css > output.css`

## cwebp
If you like having small WebP files:
1. Download cwebp from https://developers.google.com/speed/webp/download
2. (If you are on Windows 10) place `cwebp.exe` in `C:\Windows`
3. Have fun: `cwebp input.png -o output.webp` (see the [docs](https://developers.google.com/speed/webp/docs/cwebp) [[archived link](https://web.archive.org/web/20201020225626/https://developers.google.com/speed/webp/docs/cwebp)] for more info)

## svgo
If you don't like having uncompressed SVGs:
1. Download [svgo](https://github.com/svg/svgo): `npm install --save-dev svgo`
2. Compress SVGs: `svgo uncompressed.svg -o compressed.svg`