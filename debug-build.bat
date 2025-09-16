REM debug-build.bat - Enhanced build script with better error handling
@echo off
echo 🔨 Football Scorekeeper - Debug Build
echo ===================================

REM Check if we're in the right directory
if not exist "client" (
    echo ❌ Error: client folder not found
    echo Make sure you're running this from the football-scorekeeper root directory
    pause
    exit /b 1
)

if not exist "client\package.json" (
    echo ❌ Error: client\package.json not found
    echo The React app may not be properly set up
    pause
    exit /b 1
)

echo ✅ Project structure looks good
echo.

REM Check if node_modules exists in client
if not exist "client\node_modules" (
    echo ⚠️  client\node_modules not found
    echo Installing React dependencies first...
    cd client
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install React dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ React dependencies installed
    echo.
)

echo 🔍 Checking App.js file...
if not exist "client\src\App.js" (
    echo ❌ Error: client\src\App.js not found
    echo You need to copy the React component code into this file
    pause
    exit /b 1
)

REM Check if App.js has the React code (simple check)
findstr /C:"FootballScorekeeper" "client\src\App.js" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Warning: App.js may not contain the correct React code
    echo Make sure you've copied the React component from the artifact
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i "!continue!" NEQ "y" (
        echo Build cancelled
        pause
        exit /b 1
    )
)

echo ✅ App.js file found
echo.

echo 🔨 Starting React build...
echo Current directory: %CD%
cd client
echo Building in: %CD%

REM Show more detailed output
call npm run build
set build_result=%ERRORLEVEL%

echo.
echo Build exit code: %build_result%

if %build_result% NEQ 0 (
    echo.
    echo ❌ Build failed with exit code %build_result%
    echo.
    echo 🔍 Common issues and solutions:
    echo.
    echo 1. Missing React code in App.js:
    echo    - Copy the React component code from the artifact
    echo    - Make sure it starts with "import React" and exports FootballScorekeeper
    echo.
    echo 2. Syntax errors in App.js:
    echo    - Check for missing brackets, quotes, or semicolons
    echo    - Make sure all imports are correct
    echo.
    echo 3. Missing dependencies:
    echo    - Run: npm install axios lucide-react
    echo.
    echo 4. Tailwind CSS issues:
    echo    - Make sure tailwind.config.js is properly configured
    echo    - Check that @tailwind directives are in index.css
    echo.
    echo 📝 To debug further:
    echo    1. cd client
    echo    2. npm run build
    echo    3. Read the full error message
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

echo ✅ React build successful!
echo.

echo 📁 Copying build files to public directory...
if exist public (
    echo Removing old public directory...
    rmdir /s /q public
)

mkdir public
echo Copying files...
xcopy client\build\* public\ /E /Y /Q

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to copy build files
    pause
    exit /b 1
)

echo ✅ Build and copy complete!
echo.
echo 🚀 You can now run start.bat to launch the app
echo 🌐 Or manually start with: npm start
echo.
pause

REM ============================================

REM check-setup.bat - Verify project setup
@echo off
echo 🔍 Football Scorekeeper - Setup Verification
echo ==========================================

echo Checking project structure...
echo.

REM Check root files
if exist "server.js" (
    echo ✅ server.js found
) else (
    echo ❌ server.js missing
)

if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing
)

if exist "node_modules" (
    echo ✅ node_modules found
) else (
    echo ❌ node_modules missing - run: npm install
)

echo.
echo Checking client setup...

if exist "client" (
    echo ✅ client folder found
) else (
    echo ❌ client folder missing
    goto :end
)

if exist "client\package.json" (
    echo ✅ client\package.json found
) else (
    echo ❌ client\package.json missing
)

if exist "client\node_modules" (
    echo ✅ client\node_modules found
) else (
    echo ❌ client\node_modules missing - run: cd client && npm install
)

if exist "client\src\App.js" (
    echo ✅ client\src\App.js found
    REM Quick check if it has React code
    findstr /C:"import React" "client\src\App.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ App.js contains React imports
    ) else (
        echo ⚠️  App.js may not contain the React component code
    )
) else (
    echo ❌ client\src\App.js missing - copy React code here
)

if exist "client\tailwind.config.js" (
    echo ✅ tailwind.config.js found
) else (
    echo ❌ tailwind.config.js missing
)

echo.
echo Checking CSS files...

if exist "client\src\index.css" (
    findstr /C:"@tailwind" "client\src\index.css" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ index.css has Tailwind imports
    ) else (
        echo ⚠️  index.css missing Tailwind imports
    )
) else (
    echo ❌ client\src\index.css missing
)

:end
echo.
echo 📋 Next steps if issues found:
echo 1. Copy missing files from the artifacts
echo 2. Run: npm install (in root directory)
echo 3. Run: cd client && npm install
echo 4. Copy React component code to client\src\App.js
echo 5. Run: debug-build.bat
echo.
pause

REM ============================================

REM fix-common-issues.bat - Fix common setup problems
@echo off
echo 🔧 Football Scorekeeper - Fix Common Issues
echo =========================================

echo This script will attempt to fix common setup issues
echo.
set /p continue="Continue? (y/N): "
if /i "%continue%" NEQ "y" (
    echo Cancelled
    pause
    exit /b 0
)

echo.
echo 1. Installing/updating dependencies...
call npm install

if exist "client" (
    echo 2. Installing/updating React dependencies...
    cd client
    call npm install axios lucide-react
    call npm install -D tailwindcss autoprefixer postcss
    cd ..
) else (
    echo ❌ Client folder not found - need to run setup first
)

echo 3. Recreating Tailwind config...
if exist "client" (
    cd client
    call npx tailwindcss init -p --force
    cd ..
)

echo 4. Updating index.css with Tailwind imports...
if exist "client\src" (
    echo @tailwind base; > "client\src\index.css"
    echo @tailwind components; >> "client\src\index.css"
    echo @tailwind utilities; >> "client\src\index.css"
    echo. >> "client\src\index.css"
    echo body { >> "client\src\index.css"
    echo   margin: 0; >> "client\src\index.css"
    echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; >> "client\src\index.css"
    echo } >> "client\src\index.css"
)

echo.
echo ✅ Common fixes applied!
echo.
echo 📝 You still need to manually:
echo 1. Copy the React component code into client\src\App.js
echo 2. Run debug-build.bat to test the build
echo.
pause