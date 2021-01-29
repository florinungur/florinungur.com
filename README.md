![logo](img/logo/logo.svg)

This is the source code for my personal website located at https://florinungur.com.

## cssnano

To minify CSS the same way I do:

1. Download the [cssnano](https://cssnano.co/) npm package: `npm install --save-dev cssnano`
2. cssnano also needs a PostCSS runner: `npm install --global postcss postcss-cli`
3. Use (or modify) [postcss.config.js](postcss.config.js)
4. Try it out: `postcss input.css > output.css`

## cwebp

If you like having small WebP files:

1. Download [cwebp](https://developers.google.com/speed/webp/download)
2. (If you are on Windows 10) place `cwebp.exe` in `C:\Windows`
3. Have fun: `cwebp input.png -o output.webp` (see the [docs](https://developers.google.com/speed/webp/docs/cwebp)
   [[archived link]](https://web.archive.org/web/20201020225626/https://developers.google.com/speed/webp/docs/cwebp) for more info)

## svgo

If you don't like having uncompressed SVGs:

1. Download [svgo](https://github.com/svg/svgo): `npm install --save-dev svgo`
2. Compress SVGs: `svgo uncompressed.svg -o compressed.svg`

## exiftool

If you want your files to be cleaned of metadata:

1. Download [exiftool](https://exiftool.org/)
2. Remove meta information: `exiftool -verbose -recurse -overwrite_original -all= *.jpg`
