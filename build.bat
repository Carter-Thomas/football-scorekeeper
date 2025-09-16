@echo off
echo Building React app...
cd client
call npm run build
cd ..
echo Copying build files...
if exist public rmdir /s /q public
mkdir public
xcopy client\build\* public\ /E /Y
echo Build complete!
echo Run "npm start" or "start.bat" to launch the app
