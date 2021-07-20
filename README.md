![logo](img/logo/logo.svg)

This is the source code for my personal website located at https://florinungur.com.

## svgo

If you don't like having uncompressed SVGs:

1. Download [svgo](https://github.com/svg/svgo): `npm install --save-dev svgo`
2. Compress SVGs: `svgo uncompressed.svg -o compressed.svg`

## exiftool

If you want your files to be cleaned of metadata:

1. Download [exiftool](https://exiftool.org/)
2. Remove meta information: `exiftool -verbose -recurse -overwrite_original -all= *.jpg`
