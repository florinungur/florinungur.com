![logo](img/logo/logo.svg)

This is the source code for my personal website located at https://florinungur.com.

## exiftool

If you want your files to be cleaned of metadata:

1. Download [exiftool](https://exiftool.org/)
2. Remove meta information: `exiftool -verbose -recurse -overwrite_original -all= *.jpg`
