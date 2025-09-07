#!/bin/bash
# Remove node_modules & dist from Git history (but keep locally)
set -euxo pipefail

git rm -rf --cached node_modules dist ios/App/build
git add .gitignore
git commit -m "chore: add .gitignore and remove node_modules/dist from repo"
git push
