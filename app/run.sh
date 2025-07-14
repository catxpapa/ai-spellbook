#!/bin/sh
cd /lzcapp/pkg/content/app
apk update
apk add nodejs npm
npm install
npm run start
