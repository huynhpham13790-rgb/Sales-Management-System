@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==== CAI DAT SALESFLOW AI ====

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Xem Buoc 1 trong HUONG-DAN-CAI-DAT.md
  pause & exit /b 1
)

if not exist server\.env (
  copy server\.env.example server\.env >nul
  set /p KEY=Dan GROQ API KEY roi nhan Enter ^(bo trong neu khong co^): 
  call :setkey
)

echo.
echo [1/3] Tai thu vien server...
cd server
call npm install || goto :fail
echo.
echo [2/3] Tao co so du lieu mau (MySQL trong XAMPP phai dang chay)...
call npm run seed || goto :fail
echo.
echo [3/3] Tai thu vien giao dien...
cd ..\client
call npm install || goto :fail
cd ..
echo.
echo ===== CÀI ĐẶT XONG =====
echo Nhap dup start.bat de chay web.
pause
exit /b 0

:setkey
if not "%KEY%"=="" powershell -NoProfile -Command "(Get-Content 'server\.env') -replace '^GROQ_API_KEY=.*', 'GROQ_API_KEY=%KEY%' | Set-Content -Encoding ascii 'server\.env'"
exit /b 0

:fail
echo.
echo [LOI] Cai dat that bai. Xem muc "Xu ly loi" trong HUONG-DAN-CAI-DAT.md
pause
exit /b 1
