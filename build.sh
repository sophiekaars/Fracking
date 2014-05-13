#!/usr/bin/env bash
ford build --skip
cp lib/main/application/application.css output/application.min.css
cp -r lib/main/application/images output/images
cp -r movies output/movies
mv output/index.html output/infomaze.html
cp launcher.html output/index.html
cp bigslide.jpg output/bigslide.jpg
rm -rf ~/Desktop/frackingmaze.info
mv output ~/Desktop/frackingmaze.info

