// components/GamecastView.js
import React from 'react';
import { Settings, Users, Lock, LogOut, Wifi, WifiOff } from 'lucide-react';

const GamecastView = ({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  quarter, 
  timeLeft, 
  down, 
  distance, 
  yardLine, 
  possession, 
  timeouts, 
  playByPlay, 
  isConnected, 
  isAuthenticated, 
  currentUser, 
  setViewMode, 
  handleLogout,
  formatTime 
}) => {
  // Format yard line display for proper football notation
  const formatYardLineDisplay = (yardLine, possession, homeTeam, awayTeam) => {
    if (yardLine === 50) {
      return "50"; // Midfield
    }
    
    if (yardLine < 50) {
      // Ball is on the possession team's side of the field
      const teamName = possession === 'home' ? homeTeam : awayTeam;
      return `${teamName} ${yardLine}`;
    } else {
      // Ball is on the opponent's side of the field
      const opposingYardLine = 100 - yardLine;
      const opposingTeam = possession === 'home' ? awayTeam : homeTeam;
      return `${opposingTeam} ${opposingYardLine}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-50 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">High School Football</h1>
          <div className="flex gap-2 items-center">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi size={16} className="text-green-400" />
              ) : (
                <WifiOff size={16} className="text-red-400" />
              )}
              <span className="text-sm">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {isAuthenticated ? (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-300">
                  Logged in as: <span className="font-medium">{currentUser?.username}</span>
                </span>
                <button 
                  onClick={() => setViewMode('scorekeeper')}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
                >
                  <Settings size={16} />
                  Admin Panel
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setViewMode('login')}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
              >
                <Lock size={16} />
                Admin Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-black bg-opacity-70 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-6 items-center">
            {/* Away Team */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{awayTeam}</h2>
              <div className="text-6xl font-bold text-yellow-400">{awayScore}</div>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(timeouts.away)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400 rounded"></div>
                ))}
              </div>
            </div>

            {/* Game Info */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{formatTime(timeLeft)}</div>
              <div className="text-xl mb-2">Q{quarter}</div>
              <div className="text-lg">
                {down}{['st', 'nd', 'rd', 'th'][down-1]} & {distance}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                Ball on {formatYardLineDisplay(yardLine, possession, homeTeam, awayTeam)}
              </div>
            </div>

            {/* Home Team */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{homeTeam}</h2>
              <div className="text-6xl font-bold text-yellow-400">{homeScore}</div>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(timeouts.home)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Possession Indicator */}
          <div className="text-center mt-4">
            <div className="text-lg">
              <span className="bg-yellow-600 px-3 py-1 rounded">
                {possession === 'home' ? homeTeam : awayTeam} has possession
              </span>
            </div>
          </div>
        </div>

        {/* Play by Play */}
        <div className="bg-black bg-opacity-70 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} />
            Play by Play
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playByPlay.length === 0 ? (
              <p className="text-gray-400">Game hasn't started yet...</p>
            ) : (
              playByPlay.map((play, index) => {
                // Check if this is the first play or if possession changed from previous play
                const showPossessionDivider = index === 0 || 
                  (index > 0 && playByPlay[index - 1].team !== play.team);
                
                return (
                  <div key={play.id}>
                    {showPossessionDivider && (
                      <div className="flex items-center my-3">
                        <div className="flex-1 border-t border-yellow-400"></div>
                        <div className="px-3 text-sm font-medium text-yellow-400 bg-black bg-opacity-50 rounded">
                          {play.team} Possession
                        </div>
                        <div className="flex-1 border-t border-yellow-400"></div>
                      </div>
                    )}
                    <div className="border-l-4 border-yellow-400 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{play.play}</span>
                        <span className="text-sm text-gray-300">{play.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamecastView;