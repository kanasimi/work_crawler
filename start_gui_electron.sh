#!/bin/sh

echo "Loading work_crawler GUI..."

# Will call "main" @ package.json
node_modules/.bin/electron . || ~/node_modules/.bin/electron .
