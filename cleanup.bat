\
@echo off
echo Removing node_modules and dist from repo cache...
git rm -rf --cached node_modules dist ios\App\build
git add .gitignore
git commit -m "chore: add .gitignore and remove node_modules/dist from repo"
git push
