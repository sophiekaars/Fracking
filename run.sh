#!/usr/bin/env bash
ford build --skip 
cd output 
cp -r ../lib/main/application/images/ images 
sed -i "" "s/..\/lib\/main\/application\///g" application.min.css 
cd .. 
rm -rf ~/Desktop/fracking
mv output ~/Desktop/fracking
cd ~/Desktop/
rm fracking.zip
zip fracking.zip fracking/*
echo "Project now on desktop as fracking.zip"

