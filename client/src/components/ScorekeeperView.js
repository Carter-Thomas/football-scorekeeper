// components/ScorekeeperView.js
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Users, LogOut, Wifi, WifiOff, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import { SimpleTextInput, SimpleNumberInput, SimpleTextarea } from './InputComponents';
import StatsManager from './StatsManager';

const ScorekeeperView = ({ 
  currentUser,
  isConnected,
  isAnyInputFocused,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  quarter,
  timeLeft,
  isClockRunning,
  down,
  distance,
  yardLine,
  possession,
  timeouts,
  currentPlay,
  playByPlay,
  assignedKickers,
  rosters,
  setViewMode,
  resetGame,
  handleLogout,
  updateTeamName,
  addScore,
  useTimeout,
  restoreTimeout,
  setIsClockRunning,
  updateGameSituation,
  nextDown,
  firstDown,
  nextQuarter,
  setCurrentPlay,
  addCustomPlay,
  deletePlayByPlay,
  formatTime,
  onInputFocusChange,
  saveKickers,
  saveRosters
}) => {
  const [minutes, setMinutes] = useState(Math.floor(timeLeft / 60));
  const [seconds, setSeconds] = useState(timeLeft % 60);
  const [isEditingTime, setIsEditingTime] = useState(false);

  // Update time display when timeLeft changes from server
  useEffect(() => {
    setMinutes(Math.floor(timeLeft / 60));
    setSeconds(timeLeft % 60);
  }, [timeLeft]);

  const handleTimeSet = () => {
    const newTime = minutes * 60 + seconds;
    updateGameSituation({ time_left: newTime });
    setIsEditingTime(false);
  };

  const handleTimeCancel = () => {
    setMinutes(Math.floor(timeLeft / 60));
    setSeconds(timeLeft % 60);
    setIsEditingTime(false);
  };

  const handleResetClock = () => {
    const newTime = 15 * 60;
    setMinutes(15);
    setSeconds(0);
    updateGameSituation({ time_left: newTime });
  };

  const incrementMinutes = () => {
    setMinutes(prev => Math.min(prev + 1, 60));
  };

  const decrementMinutes = () => {
    setMinutes(prev => Math.max(prev - 1, 0));
  };

  const incrementSeconds = () => {
    setSeconds(prev => {
      if (prev === 59) {
        setMinutes(min => Math.min(min + 1, 60));
        return 0;
      }
      return prev + 1;
    });
  };

  const decrementSeconds = () => {
    setSeconds(prev => {
      if (prev === 0) {
        setMinutes(min => Math.max(min - 1, 0));
        return 59;
      }
      return prev - 1;
    });
  };

  // Handle direct input changes
  const handleMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMinutes(Math.min(Math.max(value, 0), 60));
  };

  const handleSecondsChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setSeconds(Math.min(Math.max(value, 0), 59));
  };

  // Handle key presses for quick navigation
  const handleKeyDown = (e, field) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'minutes') incrementMinutes();
      else incrementSeconds();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (field === 'minutes') decrementMinutes();
      else decrementSeconds();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleTimeSet();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTimeCancel();
    }
  };

  // Get kicker name for team from props
  const getKickerName = (team) => {
    if (!assignedKickers || !assignedKickers[team] || !rosters) return null;
    
    const kickerId = assignedKickers[team];
    const kicker = rosters[team].find(p => p.id === kickerId);
    return kicker ? kicker.name : null;
  };

  // Enhanced scoring functions
  const [fieldDirection, setFieldDirection] = useState('home'); // Track field direction for kicking

  const handleTouchdown = (team) => {
    // TD button adds 6 points without logging to play-by-play
    updateGameSituation({ 
      [team === 'home' ? 'home_score' : 'away_score']: 
        team === 'home' ? homeScore + 6 : awayScore + 6 
    });
  };

  // Include kicker name in field goals
  const handleFieldGoal = (team, made = true) => {
    // Calculate distance based on field direction
    let distance;
    if (fieldDirection === 'home') {
      // Moving toward home goal - distance is (100 - yardLine) + 17
      distance = (100 - yardLine) + 17;
    } else {
      // Moving toward away goal - distance is yardLine + 17
      distance = yardLine + 17;
    }
    
    const teamName = team === 'home' ? homeTeam : awayTeam;
    const kickerName = getKickerName(team);
    const kickerText = kickerName ? `${kickerName} ` : '';
    
    if (made) {
      addScore(team, 3, `${distance} Yard Field Goal - ${kickerText}: ${teamName}`);
    } else {
      addCustomPlay(`${distance} Yard Field Goal MISSED - ${kickerText}: ${teamName}` , teamName);
    }
  };

  const handleSafety = (team) => {
    addScore(team, 2, `SAFETY - ${team === 'home' ? homeTeam : awayTeam}`);
  };

  const handleTwoPointConversion = (team) => {
    addScore(team, 2, `2-POINT CONVERSION - ${team === 'home' ? homeTeam : awayTeam}`);
  };

  // Handle extra points with kicker name
  const handleExtraPoint = (team) => {
    const teamName = team === 'home' ? homeTeam : awayTeam;
    const kickerName = getKickerName(team);
    const kickerText = kickerName ? `${kickerName} ` : '';
    addScore(team, 1, `Extra Point - ${kickerText}: ${teamName}`);
  };

  // Timeout handlers - now includes restore functionality
  const handleUseTimeout = (team) => {
    if (useTimeout) {
      useTimeout(team);
    }
  };

  const handleRestoreTimeout = (team) => {
    // Update game situation directly to restore timeout
    const currentTimeouts = timeouts[team];
    if (currentTimeouts < 3) {
      updateGameSituation({
        timeouts: {
          ...timeouts,
          [team]: currentTimeouts + 1
        }
      });
    }
    
    // Also call the restoreTimeout prop if it exists (for any additional logic)
    if (restoreTimeout) {
      restoreTimeout(team);
    }
  };

  // Placeholder delete function
  const handleDeletePlay = (playIndex) => {
    console.log(`Delete play at index ${playIndex}`);
    alert(`Delete functionality needs to be implemented in your parent component. Play index: ${playIndex}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Football Scorekeeper</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span>Logged in as: <span className="font-medium">{currentUser?.username}</span> ({currentUser?.role})</span>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <Wifi size={16} className="text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <Wifi size={16} className="text-red-600" />
                    <span className="text-sm text-red-600">Connection Lost</span>
                  </>
                )}
              </div>
              {isAnyInputFocused && (
                <span className="text-sm text-orange-600">Editing... (polling paused)</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('gamecast')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Users size={16} />
              Public View
            </button>
            <button 
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
              disabled={!isConnected}
            >
              <RotateCcw size={16} />
              Reset Game
            </button>
            <button 
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Team Setup & Scores */}
          <div className="space-y-6">
            {/* Team Names */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Team Names</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Away Team</label>
                  <SimpleTextInput
                    initialValue={awayTeam}
                    onSave={(value) => updateTeamName('away', value)}
                    placeholder="Enter away team name"
                    disabled={!isConnected}
                    onFocusChange={onInputFocusChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Home Team</label>
                  <SimpleTextInput
                    initialValue={homeTeam}
                    onSave={(value) => updateTeamName('home', value)}
                    placeholder="Enter home team name"
                    disabled={!isConnected}
                    onFocusChange={onInputFocusChange}
                  />
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Scoring</h3>
              
              {/* Field Direction Control for Kicking */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <label className="block text-sm font-medium mb-2">Field Goal Direction</label>
                <select 
                  value={fieldDirection}
                  onChange={(e) => setFieldDirection(e.target.value)}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                  title="Which goal are field goals being kicked toward?"
                >
                  <option value="home">Kicking toward {homeTeam} goal</option>
                  <option value="away">Kicking toward {awayTeam} goal</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Current FG distance: {fieldDirection === 'home' ? (100 - yardLine) + 17 : yardLine + 17} yards
                  {getKickerName('away') && (
                    <div className="mt-1">
                      {awayTeam} Kicker: {getKickerName('away')}
                    </div>
                  )}
                  {getKickerName('home') && (
                    <div className="mt-1">
                      {homeTeam} Kicker: {getKickerName('home')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Away Team Scoring */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{awayTeam}: {awayScore}</h4>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        // Direct score update without play-by-play logging
                        updateGameSituation({ away_score: Math.max(0, awayScore - 1) });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1 disabled:bg-gray-400"
                      disabled={!isConnected || awayScore === 0}
                      title="Decrease score by 1"
                    >
                      <Minus size={14} />
                      -1
                    </button>
                    <button 
                      onClick={() => {
                        // Direct score update without play-by-play logging
                        updateGameSituation({ away_score: awayScore + 1 });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1 disabled:bg-gray-400"
                      disabled={!isConnected}
                      title="Increase score by 1"
                    >
                      <Plus size={14} />
                      +1
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => handleTouchdown('away')} 
                    className="bg-green-600 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    TD (6)
                  </button>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleFieldGoal('away', true)} 
                      className="bg-blue-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                      title={`${fieldDirection === 'home' ? (100 - yardLine) + 17 : yardLine + 17} yard FG`}
                    >
                      FG ✓
                    </button>
                    <button 
                      onClick={() => handleFieldGoal('away', false)} 
                      className="bg-red-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                      title={`${fieldDirection === 'home' ? (100 - yardLine) + 17 : yardLine + 17} yard FG missed`}
                    >
                      FG ✗
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleSafety('away')} 
                      className="bg-purple-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                    >
                      Safety
                    </button>
                    <button 
                      onClick={() => handleTwoPointConversion('away')} 
                      className="bg-orange-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                    >
                      2-PT
                    </button>
                  </div>
                  <button 
                    onClick={() => handleExtraPoint('away')} 
                    className="bg-yellow-600 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    XP (1)
                  </button>
                </div>
              </div>

              {/* Home Team Scoring */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{homeTeam}: {homeScore}</h4>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        // Direct score update without play-by-play logging
                        updateGameSituation({ home_score: Math.max(0, homeScore - 1) });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1 disabled:bg-gray-400"
                      disabled={!isConnected || homeScore === 0}
                      title="Decrease score by 1"
                    >
                      <Minus size={14} />
                      -1
                    </button>
                    <button 
                      onClick={() => {
                        // Direct score update without play-by-play logging
                        updateGameSituation({ home_score: homeScore + 1 });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1 disabled:bg-gray-400"
                      disabled={!isConnected}
                      title="Increase score by 1"
                    >
                      <Plus size={14} />
                      +1
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => handleTouchdown('home')} 
                    className="bg-green-600 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    TD (6)
                  </button>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleFieldGoal('home', true)} 
                      className="bg-blue-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                      title={`${100 - yardLine + 17} yard FG`}
                    >
                      FG ✓
                    </button>
                    <button 
                      onClick={() => handleFieldGoal('home', false)} 
                      className="bg-red-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                      title={`${100 - yardLine + 17} yard FG missed`}
                    >
                      FG ✗
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleSafety('home')} 
                      className="bg-purple-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                    >
                      Safety
                    </button>
                    <button 
                      onClick={() => handleTwoPointConversion('home')} 
                      className="bg-orange-600 text-white p-1 rounded text-xs disabled:bg-gray-400"
                      disabled={!isConnected}
                    >
                      2-PT
                    </button>
                  </div>
                  <button 
                    onClick={() => handleExtraPoint('home')} 
                    className="bg-yellow-600 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    XP (1)
                  </button>
                </div>
              </div>
            </div>

            {/* Timeouts - Enhanced with restore functionality */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Timeouts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>{awayTeam}: {timeouts.away}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleUseTimeout('away')}
                      disabled={timeouts.away === 0 || !isConnected}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs"
                      title="Use timeout"
                    >
                      Use
                    </button>
                    <button 
                      onClick={() => handleRestoreTimeout('away')}
                      disabled={timeouts.away >= 3 || !isConnected}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs"
                      title="Restore timeout"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>{homeTeam}: {timeouts.home}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleUseTimeout('home')}
                      disabled={timeouts.home === 0 || !isConnected}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs"
                      title="Use timeout"
                    >
                      Use
                    </button>
                    <button 
                      onClick={() => handleRestoreTimeout('home')}
                      disabled={timeouts.home >= 3 || !isConnected}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs"
                      title="Restore timeout"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Game Clock & Situation */}
          <div className="space-y-6">
            {/* Game Clock */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Game Clock</h3>
              <div className="text-center mb-4">
                {isEditingTime ? (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={incrementMinutes}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded-t-md"
                        disabled={!isConnected}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={minutes}
                        onChange={handleMinutesChange}
                        onKeyDown={(e) => handleKeyDown(e, 'minutes')}
                        onFocus={onInputFocusChange}
                        onBlur={onInputFocusChange}
                        className="w-16 h-14 text-4xl font-bold text-center border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isConnected}
                      />
                      <button 
                        onClick={decrementMinutes}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded-b-md"
                        disabled={!isConnected}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <span className="text-4xl font-bold">:</span>
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={incrementSeconds}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded-t-md"
                        disabled={!isConnected}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={seconds}
                        onChange={handleSecondsChange}
                        onKeyDown={(e) => handleKeyDown(e, 'seconds')}
                        onFocus={onInputFocusChange}
                        onBlur={onInputFocusChange}
                        className="w-16 h-14 text-4xl font-bold text-center border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isConnected}
                      />
                      <button 
                        onClick={decrementSeconds}
                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded-b-md"
                        disabled={!isConnected}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-4xl font-bold mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingTime(true)}
                    title="Click to edit time"
                  >
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                  </div>
                )}
                <div className="text-xl">Quarter {quarter}</div>
              </div>
              
              {isEditingTime ? (
                <div className="flex gap-2 justify-center mb-4">
                  <button 
                    onClick={handleTimeSet}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    Set Time
                  </button>
                  <button 
                    onClick={handleTimeCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 justify-center mb-4">
                  <button 
                    onClick={handleResetClock}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    Reset to 15:00
                  </button>
                </div>
              )}

              {isEditingTime && (
                <div className="text-xs text-gray-500 text-center mb-2">
                  Use arrow keys or type directly. Press Enter to save, Escape to cancel.
                </div>
              )}
              
              <button 
                onClick={() => {
                  const newQuarter = quarter === 4 ? 1 : quarter + 1;
                  updateGameSituation({ quarter: newQuarter });
                }}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded disabled:bg-gray-400"
                disabled={!isConnected || isEditingTime}
              >
                Next Quarter
              </button>
            </div>

            {/* Game Situation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Game Situation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Possession</label>
                  <select 
                    value={possession}
                    onChange={(e) => updateGameSituation({ possession: e.target.value })}
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    disabled={!isConnected}
                  >
                    <option value="home">{homeTeam}</option>
                    <option value="away">{awayTeam}</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Down</label>
                    <select 
                      value={down}
                      onChange={(e) => updateGameSituation({ down: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded disabled:bg-gray-100"
                      disabled={!isConnected}
                    >
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                      <option value="4">4th</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Distance</label>
                    <SimpleNumberInput
                      initialValue={distance}
                      onSave={(value) => updateGameSituation({ distance: value })}
                      disabled={!isConnected}
                      onFocusChange={onInputFocusChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Yard Line</label>
                    <SimpleNumberInput
                      initialValue={yardLine}
                      onSave={(value) => updateGameSituation({ yardLine: value })}
                      disabled={!isConnected}
                      onFocusChange={onInputFocusChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Field Direction</label>
                  <select 
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    disabled={!isConnected}
                    title="For reference: Which direction is positive yardage?"
                  >
                    <option value="home">Toward {homeTeam} Goal (Higher yard lines)</option>
                    <option value="away">Toward {awayTeam} Goal (Lower yard lines)</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Current: {yardLine < 50 ? `${possession === 'home' ? homeTeam : awayTeam} territory` : 
                            `${possession === 'home' ? awayTeam : homeTeam} territory`}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={nextDown}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    Next Down
                  </button>
                  <button 
                    onClick={firstDown}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm disabled:bg-gray-400"
                    disabled={!isConnected}
                  >
                    First Down
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Play Management */}
          <div className="space-y-6">
            {/* Current Play */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Current Play</h3>
              <div className="space-y-3">
                <SimpleTextarea
                  initialValue={currentPlay}
                  onSave={setCurrentPlay}
                  placeholder="Describe the current play..."
                  disabled={!isConnected}
                  onFocusChange={onInputFocusChange}
                />
                <button 
                  onClick={() => addCustomPlay(currentPlay)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded disabled:bg-gray-400"
                  disabled={!isConnected || !currentPlay.trim()}
                >
                  Add to Play-by-Play
                </button>
              </div>
            </div>

            {/* Play-by-Play */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Play-by-Play</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {playByPlay.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No plays recorded yet</p>
                ) : (
                  playByPlay.map((play, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">{play.team}</span>
                        <span className="text-xs text-gray-500">{play.time}</span>
                      </div>
                      <p className="text-sm mt-1">{play.description}</p>
                      {play.scoreChange && (
                        <div className="text-xs text-green-600 mt-1">
                          +{play.scoreChange} points
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Manager Section */}
        <div className="mt-8">
          <StatsManager
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            possession={possession}
            down={down}
            distance={distance}
            yardLine={yardLine}
            playByPlay={playByPlay}
            updateGameSituation={updateGameSituation}
            addCustomPlay={addCustomPlay}
            deletePlayByPlay={deletePlayByPlay || handleDeletePlay}
            isConnected={isConnected}
            onInputFocusChange={onInputFocusChange}
            rosters={rosters}
            assignedKickers={assignedKickers}
            saveRosters={saveRosters}
            saveKickers={saveKickers}
          />
        </div>
      </div>
    </div>
  );
};

export default ScorekeeperView;
