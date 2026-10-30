#!/usr/bin/env bash
# Installs CI's system packages from the .debs the apt cache step restores, downloading them first on a miss.
# The cache key hashes this file, so editing the package list refreshes the cache. $1 is the cache step's cache-hit output.
set -euo pipefail

packages=(webp libxml2-utils)
debs=/tmp/apt-pkgs

if [[ ${1:-} != true ]]; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends --download-only "${packages[@]}"
  mkdir -p "$debs"
  cp /var/cache/apt/archives/*.deb "$debs/"
fi
sudo dpkg -i "$debs"/*.deb
