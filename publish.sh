#!/bin/bash

npm run build

echo ==============================
echo Current package.json
echo ==============================
cat package.json
echo

read -p "Wanna continue with the publish process? (y/n)? " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo Publish process stopped
    exit 0
fi

cp package.json README.md dist/

cd dist
npm publish
