#!/usr/bin/env bash
ford build --skip
cp lib/main/application/application.css output/application.min.css
#cat images.css >> output/application.min.css
#cp -r lib/main/application/images output/images
#cp -r movies output/movies
mv output/index.html output/infomaze.html
sed -i '' 's/application\.min/http:\/\/d1zd9zhjj7e0j.cloudfront.net\/fracking\/application.min/g' output/infomaze.html
rm -rf output/application.min.css
rm -rf output/application.min.js
cp launcher.html output/index.html
#cp bigslide.jpg output/bigslide.jpg
rm -rf ~/Desktop/frackingmaze.info
mv output ~/Desktop/frackingmaze.info

