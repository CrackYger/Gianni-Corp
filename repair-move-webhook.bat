
@echo off
setlocal enabledelayedexpansion
echo === Giannicorp Admin Repair: move webhook files to .\webhook ===

if not exist webhook (
  mkdir webhook
)

rem move package.json only if it looks like the webhook one (contains "giannicorp-admin-webhook-express")
set isWebhook=0
if exist package.json (
  for /f "usebackq delims=" %%A in ("package.json") do (
    echo %%A | findstr /C:"giannicorp-admin-webhook-express" >nul && set isWebhook=1
  )
)
if %isWebhook%==1 (
  echo Moving webhook package.json to .\webhook\
  move /Y package.json webhook\package.json >nul
) else (
  echo package.json does not look like webhook's. Skipping move.
)

if exist src\index.js (
  echo Moving src\index.js to .\webhook\src\
  if not exist webhook\src mkdir webhook\src
  move /Y src\index.js webhook\src\index.js >nul
)

if exist .env (
  echo Moving .env to .\webhook\.env
  move /Y .env webhook\.env >nul
)
if exist .env.example (
  echo Moving .env.example to .\webhook\.env.example
  move /Y .env.example webhook\.env.example >nul
)
if exist data (
  echo Moving data\ to .\webhook\data\
  move /Y data webhook\ >nul
)

echo Done. Now restore your original package.json in the project root.
echo See README.txt for next steps.
pause
