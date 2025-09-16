REM setup-tailwind.bat - Complete Tailwind CSS Configuration
@echo off
echo 🎨 Football Scorekeeper - Tailwind CSS Setup
echo ==========================================

echo Checking current directory...
if not exist "client" (
    echo ❌ Error: Run this from the football-scorekeeper root directory
    pause
    exit /b 1
)

cd client

echo 📦 Installing/updating Tailwind CSS dependencies...
call npm install -D tailwindcss@latest autoprefixer@latest postcss@latest
call npm install -D @tailwindcss/forms @tailwindcss/typography

echo 🔧 Creating Tailwind configuration...

REM Create tailwind.config.js
echo /** @type {import('tailwindcss').Config} */ > tailwind.config.js
echo module.exports = { >> tailwind.config.js
echo   content: [ >> tailwind.config.js
echo     "./src/**/*.{js,jsx,ts,tsx}", >> tailwind.config.js
echo     "./public/index.html" >> tailwind.config.js
echo   ], >> tailwind.config.js
echo   theme: { >> tailwind.config.js
echo     extend: { >> tailwind.config.js
echo       colors: { >> tailwind.config.js
echo         'football-green': { >> tailwind.config.js
echo           50: '#f0fdf4', >> tailwind.config.js
echo           500: '#22c55e', >> tailwind.config.js
echo           600: '#16a34a', >> tailwind.config.js
echo           700: '#15803d', >> tailwind.config.js
echo           800: '#166534', >> tailwind.config.js
echo           900: '#14532d' >> tailwind.config.js
echo         }, >> tailwind.config.js
echo         'football-blue': { >> tailwind.config.js
echo           500: '#3b82f6', >> tailwind.config.js
echo           600: '#2563eb', >> tailwind.config.js
echo           700: '#1d4ed8' >> tailwind.config.js
echo         } >> tailwind.config.js
echo       }, >> tailwind.config.js
echo       fontFamily: { >> tailwind.config.js
echo         'scoreboard': ['Orbitron', 'monospace'], >> tailwind.config.js
echo         'display': ['Inter', 'system-ui', 'sans-serif'] >> tailwind.config.js
echo       }, >> tailwind.config.js
echo       animation: { >> tailwind.config.js
echo         'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', >> tailwind.config.js
echo         'fade-in': 'fadeIn 0.5s ease-in-out' >> tailwind.config.js
echo       }, >> tailwind.config.js
echo       keyframes: { >> tailwind.config.js
echo         fadeIn: { >> tailwind.config.js
echo           '0%%': { opacity: '0', transform: 'translateY(10px)' }, >> tailwind.config.js
echo           '100%%': { opacity: '1', transform: 'translateY(0)' } >> tailwind.config.js
echo         } >> tailwind.config.js
echo       } >> tailwind.config.js
echo     } >> tailwind.config.js
echo   }, >> tailwind.config.js
echo   plugins: [ >> tailwind.config.js
echo     require('@tailwindcss/forms'), >> tailwind.config.js
echo     require('@tailwindcss/typography') >> tailwind.config.js
echo   ] >> tailwind.config.js
echo }; >> tailwind.config.js

echo ✅ tailwind.config.js created with football theme!

REM Create postcss.config.js
echo module.exports = { > postcss.config.js
echo   plugins: { >> postcss.config.js
echo     tailwindcss: {}, >> postcss.config.js
echo     autoprefixer: {} >> postcss.config.js
echo   } >> postcss.config.js
echo }; >> postcss.config.js

echo ✅ postcss.config.js created!

echo 🎨 Setting up CSS files...

REM Create comprehensive index.css
(
echo @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;700;900&display=swap'^);
echo.
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo @layer base {
echo   html {
echo     font-family: 'Inter', system-ui, sans-serif;
echo   }
echo.
echo   body {
echo     margin: 0;
echo     line-height: 1.6;
echo     -webkit-font-smoothing: antialiased;
echo     -moz-osx-font-smoothing: grayscale;
echo   }
echo }
echo.
echo @layer components {
echo   /* Scorekeeper Button Styles */
echo   .btn-primary {
echo     @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none;
echo   }
echo.
echo   .btn-success {
echo     @apply bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none;
echo   }
echo.
echo   .btn-danger {
echo     @apply bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none;
echo   }
echo.
echo   .btn-secondary {
echo     @apply bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none;
echo   }
echo.
echo   /* Score Display */
echo   .score-display {
echo     @apply text-6xl font-bold text-yellow-400 font-scoreboard tracking-wider drop-shadow-lg;
echo   }
echo.
echo   /* Team Name */
echo   .team-name {
echo     @apply text-3xl font-bold text-white font-display tracking-wide;
echo   }
echo.
echo   /* Game Clock */
echo   .game-clock {
echo     @apply text-4xl font-bold font-scoreboard tracking-widest;
echo   }
echo.
echo   /* Card Styles */
echo   .card {
echo     @apply bg-white rounded-lg shadow-md border border-gray-200 transition-shadow duration-200 hover:shadow-lg;
echo   }
echo.
echo   .card-header {
echo     @apply px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg;
echo   }
echo.
echo   .card-body {
echo     @apply p-6;
echo   }
echo.
echo   /* Input Styles */
echo   .input-field {
echo     @apply w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed;
echo   }
echo.
echo   /* Status Indicators */
echo   .status-online {
echo     @apply flex items-center gap-2 text-green-600 font-medium;
echo   }
echo.
echo   .status-offline {
echo     @apply flex items-center gap-2 text-red-600 font-medium;
echo   }
echo.
echo   /* Gamecast Background */
echo   .gamecast-bg {
echo     @apply min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white;
echo   }
echo.
echo   /* Scoreboard Background */
echo   .scoreboard-bg {
echo     @apply bg-black bg-opacity-70 backdrop-blur-sm rounded-lg border border-gray-700;
echo   }
echo.
echo   /* Play by Play */
echo   .play-item {
echo     @apply border-l-4 border-yellow-400 pl-4 py-3 bg-gray-900 bg-opacity-50 rounded-r-lg transition-all duration-200 hover:bg-opacity-70;
echo   }
echo.
echo   /* Timeout Indicators */
echo   .timeout-dot {
echo     @apply w-3 h-3 bg-yellow-400 rounded-full shadow-sm;
echo   }
echo.
echo   /* Loading Animation */
echo   .loading-spinner {
echo     @apply animate-spin rounded-full h-8 w-8 border-b-2 border-white;
echo   }
echo.
echo   /* Possession Indicator */
echo   .possession-indicator {
echo     @apply bg-yellow-600 px-4 py-2 rounded-full font-semibold text-black tracking-wide animate-pulse-slow;
echo   }
echo.
echo   /* Down and Distance */
echo   .down-distance {
echo     @apply text-lg font-bold tracking-wider font-scoreboard;
echo   }
echo }
echo.
echo @layer utilities {
echo   /* Custom Scrollbar */
echo   .custom-scrollbar::-webkit-scrollbar {
echo     width: 6px;
echo   }
echo.
echo   .custom-scrollbar::-webkit-scrollbar-track {
echo     @apply bg-gray-100 rounded-full;
echo   }
echo.
echo   .custom-scrollbar::-webkit-scrollbar-thumb {
echo     @apply bg-gray-400 rounded-full hover:bg-gray-500;
echo   }
echo.
echo   /* Glass Effect */
echo   .glass {
echo     @apply bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20;
echo   }
echo.
echo   /* Text Shadows */
echo   .text-shadow {
echo     text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5^);
echo   }
echo.
echo   .text-shadow-lg {
echo     text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.6^);
echo   }
echo.
echo   /* Focus Ring */
echo   .focus-ring {
echo     @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
echo   }
echo }
echo.
echo /* Custom CSS for specific elements */
echo .scorekeeper-grid {
echo   display: grid;
echo   gap: 1.5rem;
echo   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr^)^);
echo }
echo.
echo @media (min-width: 1024px^) {
echo   .scorekeeper-grid {
echo     grid-template-columns: repeat(3, 1fr^);
echo   }
echo }
echo.
echo /* Print Styles */
echo @media print {
echo   .no-print {
echo     display: none !important;
echo   }
echo.
echo   .gamecast-bg {
echo     background: white !important;
echo     color: black !important;
echo   }
echo.
echo   .scoreboard-bg {
echo     background: white !important;
echo     border: 2px solid black !important;
echo   }
echo }
) > src\index.css

echo ✅ Enhanced index.css created with football-specific styles!

REM Update App.css with additional styles
(
echo /* App.css - Additional component styles */
echo .App {
echo   text-align: center;
echo }
echo.
echo /* Enhanced Play by Play Styles */
echo .play-by-play-container {
echo   max-height: 400px;
echo   overflow-y: auto;
echo }
echo.
echo .play-by-play-container::-webkit-scrollbar {
echo   width: 8px;
echo }
echo.
echo .play-by-play-container::-webkit-scrollbar-track {
echo   background: #f1f5f9;
echo   border-radius: 10px;
echo }
echo.
echo .play-by-play-container::-webkit-scrollbar-thumb {
echo   background: #64748b;
echo   border-radius: 10px;
echo   border: 2px solid #f1f5f9;
echo }
echo.
echo .play-by-play-container::-webkit-scrollbar-thumb:hover {
echo   background: #475569;
echo }
echo.
echo /* Score Button Animations */
echo .score-button {
echo   transition: all 0.2s ease-in-out;
echo   position: relative;
echo   overflow: hidden;
echo }
echo.
echo .score-button:hover {
echo   transform: translateY(-2px^);
echo   box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2^);
echo }
echo.
echo .score-button:active {
echo   transform: translateY(0^);
echo   box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2^);
echo }
echo.
echo /* Clock Running Animation */
echo .clock-running {
echo   animation: pulse 2s infinite;
echo }
echo.
echo @keyframes pulse {
echo   0%%, 100%% {
echo     opacity: 1;
echo   }
echo   50%% {
echo     opacity: 0.7;
echo   }
echo }
echo.
echo /* Connection Status */
echo .connection-indicator {
echo   animation: fadeIn 0.3s ease-in-out;
echo }
echo.
echo .connection-lost {
echo   animation: shake 0.5s ease-in-out;
echo }
echo.
echo @keyframes shake {
echo   0%%, 100%% { transform: translateX(0^); }
echo   25%% { transform: translateX(-5px^); }
echo   75%% { transform: translateX(5px^); }
echo }
echo.
echo /* Responsive Design Helpers */
echo @media (max-width: 768px^) {
echo   .mobile-stack {
echo     flex-direction: column !important;
echo   }
echo.
echo   .mobile-full {
echo     width: 100%% !important;
echo   }
echo.
echo   .mobile-text-sm {
echo     font-size: 0.875rem !important;
echo   }
echo.
echo   .mobile-p-2 {
echo     padding: 0.5rem !important;
echo   }
echo }
echo.
echo /* Dark Mode Support */
echo @media (prefers-color-scheme: dark^) {
echo   .auto-dark {
echo     background-color: #1f2937;
echo     color: #f9fafb;
echo   }
echo.
echo   .auto-dark-card {
echo     background-color: #374151;
echo     border-color: #4b5563;
echo   }
echo }
) > src\App.css

echo ✅ Enhanced App.css created!

echo 🔄 Building CSS with new configuration...
call npx tailwindcss -i ./src/index.css -o ./src/tailwind-output.css --watch=false

echo 📱 Creating responsive design utilities...

REM Add viewport meta tag check to public/index.html
echo Checking viewport configuration...
findstr /C:"viewport" public\index.html >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Adding viewport meta tag to index.html...
    echo ^<meta name="viewport" content="width=device-width, initial-scale=1" /^> >> public\index.html
)

cd ..

echo ✅ Tailwind CSS setup complete!
echo.
echo 🎨 Features configured:
echo   • Custom football color scheme
echo   • Scoreboard fonts (Orbitron for numbers)
echo   • Component classes for buttons, cards, etc.
echo   • Responsive design utilities
echo   • Custom animations and transitions
echo   • Glass morphism effects
echo   • Print-friendly styles
echo   • Mobile optimizations
echo.
echo 📋 Usage examples:
echo   • Buttons: class="btn-primary" or "btn-success"
echo   • Scores: class="score-display"
echo   • Cards: class="card card-body"
echo   • Inputs: class="input-field"
echo.
echo 🔄 Next steps:
echo 1. Run build.bat to rebuild with new styles
echo 2. Your app now has enhanced football theming!
echo.
pause

REM ============================================

REM test-tailwind.bat - Test Tailwind classes
@echo off
echo 🧪 Testing Tailwind CSS Classes
echo ==============================

cd client

echo Testing if Tailwind is working...
call npx tailwindcss -i ./src/index.css -o ./test-output.css

if exist test-output.css (
    echo ✅ Tailwind CSS is working!
    del test-output.css
    
    echo.
    echo 📊 Available custom classes:
    echo   • .btn-primary, .btn-success, .btn-danger
    echo   • .score-display (for large score numbers)
    echo   • .team-name (for team names)
    echo   • .game-clock (for time display)
    echo   • .card, .card-body (for panels)
    echo   • .gamecast-bg (gamecast background)
    echo   • .scoreboard-bg (scoreboard overlay)
    echo.
    echo 🎨 Custom colors:
    echo   • football-green-500, football-green-600, etc.
    echo   • football-blue-500, football-blue-600, etc.
    echo.
    echo 🔤 Custom fonts:
    echo   • font-scoreboard (Orbitron for numbers)
    echo   • font-display (Inter for text)
    
) else (
    echo ❌ Tailwind CSS not working properly
    echo Check your configuration files
)

cd ..
pause