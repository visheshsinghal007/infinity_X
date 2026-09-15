@echo off
cd /d "%~dp0"
echo Epsilon X - open http://127.0.0.1:4173 after the server starts.
if not exist node_modules\pdf-parse\package.json (
 echo First run: run npm install in this folder, then launch again.
 pause
 exit /b 1
)
node server/local.mjs
pause
