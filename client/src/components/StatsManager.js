// components/StatsManager.js
import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, Plus, Save, Users, FileText, X, Check } from 'lucide-react';
import { SimpleTextInput, SimpleNumberInput } from './InputComponents';
import PlayerStatsManager from './PlayerStatsManager';
import PlayerLookup from './PlayerLookup';

const StatsManager = ({ 
  homeTeam, 
  awayTeam, 
  possession, 
  down, 
  distance, 
  yardLine,
  playByPlay,
  updateGameSituation,
  addCustomPlay,
  deletePlayByPlay,
  isConnected,
  onInputFocusChange,
  rosters,
  assignedKickers,
  saveRosters,
  saveKickers
}) => {
  // Modal state
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState('home');
  const [newPlayer, setNewPlayer] = useState({ number: '', name: '', position: '' });
  
  // Kicker Assignment State
  const [showKickerModal, setShowKickerModal] = useState(false);
  const [kickerEditingTeam, setKickerEditingTeam] = useState('home');
  
  // Enhanced Play-by-Play State
  const [playData, setPlayData] = useState({
    yardage: '',
    playType: 'rush', // 'rush' or 'pass'
    isComplete: true,
    thrower: '', // player number for passes
    ballCarrier: '', // player number for rushes/receivers
    kickReceivingTeam: 'home', // for kickoffs/punts
    kickFieldSide: 'home', // which team's side of field
    kickYardLine: '', // yard line on that team's side
    fieldDirection: 'home' // which direction is positive yardage
  });

  // Assign kicker to team
  const assignKicker = (team, playerId) => {
    const newKickers = {
      ...assignedKickers,
      [team]: playerId
    };
    saveKickers(newKickers);
    setShowKickerModal(false);
  };

  // Get kicker name for team
  const getKickerName = (team) => {
    const kickerId = assignedKickers[team];
    if (!kickerId) return null;
    
    const kicker = rosters[team].find(p => p.id === kickerId);
    return kicker ? `${kicker.name} #${kicker.number}` : null;
  };

  // Add player to roster
  const addPlayer = () => {
    if (!newPlayer.number || !newPlayer.name) return;
    
    const updatedRosters = {
      ...rosters,
      [editingTeam]: [...rosters[editingTeam], { ...newPlayer, id: Date.now() }]
    };
    saveRosters(updatedRosters);
    setNewPlayer({ number: '', name: '', position: '' });
  };

  // Remove player from roster
  const removePlayer = (team, playerId) => {
    const updatedRosters = {
      ...rosters,
      [team]: rosters[team].filter(player => player.id !== playerId)
    };
    saveRosters(updatedRosters);
    
    // Remove from kicker assignment if they were assigned
    if (assignedKickers[team] === playerId) {
      const newKickers = { ...assignedKickers, [team]: null };
      saveKickers(newKickers);
    }
  };

  // CSV Import functionality
  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const players = [];
        
        // Skip header row, process data
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [number, name, position] = line.split(',').map(s => s.trim());
            if (number && name) {
              players.push({ id: Date.now() + i, number, name, position: position || '' });
            }
          }
        }
        
        const updatedRosters = {
          ...rosters,
          [editingTeam]: [...rosters[editingTeam], ...players]
        };
        saveRosters(updatedRosters);
      } catch (error) {
        alert('Error parsing CSV file. Please ensure format: Number,Name,Position');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Export roster functionality
  const exportRoster = (team) => {
    const teamRoster = rosters[team];
    if (teamRoster.length === 0) {
      alert(`No players in ${team === 'home' ? homeTeam : awayTeam} roster to export.`);
      return;
    }

    const csvContent = 'Number,Name,Position\n' + 
      teamRoster.map(player => `${player.number},${player.name},${player.position}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${team === 'home' ? homeTeam : awayTeam}_roster.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get player name by number and team
  const getPlayerName = (team, number) => {
    if (!number) return '';
    const player = rosters[team].find(p => p.number === number.toString());
    return player ? player.name : `#${number}`;
  };

  // Check if current play type is a starting play
  const isStartingPlay = () => {
    return playData.playType === 'kickoff' || playData.playType === 'punt';
  };

  // Get current possession team's roster
  const getCurrentRoster = () => {
    return rosters[possession] || [];
  };

  // Get players by position with fallback - UPDATED to include QB in rushing
  const getPlayersByPosition = (positions, includeOthers = false) => {
    const currentRoster = getCurrentRoster();
    const positionPlayers = currentRoster.filter(player => 
      positions.some(pos => player.position?.toLowerCase() === pos.toLowerCase())
    );
    
    if (includeOthers) {
      const otherPlayers = currentRoster.filter(player => 
        !positions.some(pos => player.position?.toLowerCase() === pos.toLowerCase())
      );
      return [...positionPlayers, ...otherPlayers];
    }
    
    return positionPlayers;
  };

  // Calculate new down and distance based on yardage - FIXED
  const calculateNewSituation = (yards) => {
    // Apply directional logic: if field direction matches possession, add yards; otherwise subtract
    let adjustedYards = yards;
    if (playData.fieldDirection !== possession) {
      adjustedYards = -yards; // Flip the yardage if going against field direction
    }
    
    const newYardLine = yardLine + adjustedYards;
    const yardsGained = yards; 
    
    // Check for first down
    if (yardsGained >= distance) {
      return {
        down: 1,
        distance: 10,
        yardLine: Math.max(1, Math.min(99, newYardLine)),
        firstDown: true
      };
    }
    
    // Check for turnover on downs
    if (down === 4) {
      return {
        down: 1,
        distance: 10,
        yardLine: Math.max(1, Math.min(99, 100 - newYardLine)), // Field position flips
        possession: possession === 'home' ? 'away' : 'home',
        turnover: true
      };
    }
    
    // Check for safety (ball carrier tackled in their own end zone)
    if (newYardLine <= 0) {
      return {
        down: 1,
        distance: 10,
        yardLine: 20, // Safety kick from 20
        possession: possession === 'home' ? 'away' : 'home',
        safety: true
      };
    }
    
    // Check for touchdown
    if (newYardLine >= 100) {
      return {
        down: 1,
        distance: 10,
        yardLine: 25, // Kickoff from 25
        possession: possession === 'home' ? 'away' : 'home',
        touchdown: true
      };
    }
    
    // Normal down progression
    return {
      down: down + 1,
      distance: distance - yardsGained,
      yardLine: Math.max(1, Math.min(99, newYardLine))
    };
  };

  // Process enhanced play - UPDATED with kicker support
  const processPlay = () => {
    const startingPlay = isStartingPlay();
    
    if (!startingPlay && !playData.yardage) return;
    if (startingPlay && !playData.kickYardLine) return;
    
    let yards = 0;
    let isIncomplete = false;
    let playDescription = '';
    
    if (startingPlay) {
      // Handle kickoffs and punts with team-specific field positioning
      const kickingTeam = possession === 'home' ? homeTeam : awayTeam;
      const receivingTeam = playData.kickReceivingTeam === 'home' ? homeTeam : awayTeam;
      const kickerName = getKickerName(possession);
      
      // Calculate actual field position from team-specific input
      const actualFieldPosition = playData.kickFieldSide === 'home' ? 
        parseInt(playData.kickYardLine) : 
        100 - parseInt(playData.kickYardLine);
      
      const fieldSideTeam = playData.kickFieldSide === 'home' ? homeTeam : awayTeam;
      
      if (playData.playType === 'kickoff') {
        playDescription = kickerName ? 
          `Kickoff by ${kickerName} to ${fieldSideTeam} ${playData.kickYardLine}` :
          `Kickoff by ${kickingTeam} to ${fieldSideTeam} ${playData.kickYardLine}`;
      } else {
        playDescription = kickerName ? 
          `Punt by ${kickerName} to ${fieldSideTeam} ${playData.kickYardLine}` :
          `Punt by ${kickingTeam} to ${fieldSideTeam} ${playData.kickYardLine}`;
      }
      
      // Update possession to receiving team and set field position
      updateGameSituation({ 
        possession: playData.kickReceivingTeam,
        down: 1,
        distance: 10,
        yardLine: actualFieldPosition
      });
      
      // Add to play-by-play with explicit team information
      if (typeof addCustomPlay === 'function') {
        addCustomPlay(playDescription, kickingTeam);
      }
      
      // Reset form
      setPlayData({ 
        yardage: '', 
        playType: 'rush', 
        isComplete: true, 
        thrower: '', 
        ballCarrier: '', 
        kickReceivingTeam: 'home', 
        kickFieldSide: 'home',
        kickYardLine: '',
        fieldDirection: 'home'
      });
      return;
    }
    
    // Handle regular plays
    if (playData.yardage.toLowerCase() === 'x') {
      isIncomplete = true;
      yards = 0;
    } else {
      yards = parseInt(playData.yardage) || 0;
    }
    
    // Create play description with player names
    const currentTeam = possession === 'home' ? homeTeam : awayTeam;
    
    if (playData.playType === 'rush') {
      const rusher = getPlayerName(possession, playData.ballCarrier);
      playDescription = `${rusher ? `${rusher} ` : ''}${yards > 0 ? '+' : ''}${yards} yard rush`;
    } else {
      const thrower = getPlayerName(possession, playData.thrower);
      const receiver = getPlayerName(possession, playData.ballCarrier);
      
      if (isIncomplete) {
        playDescription = `${thrower ? `${thrower} ` : ''}incomplete pass${receiver ? ` intended for ${receiver}` : ''}`;
      } else {
        playDescription = `${thrower ? `${thrower} ` : ''}${yards > 0 ? '+' : ''}${yards} yard pass${receiver ? ` to ${receiver}` : ''} ${playData.isComplete ? '(complete)' : '(incomplete)'}`;
      }
    }
    
    // Calculate new game situation
    const newSituation = calculateNewSituation(yards);
    
    // Add descriptive text for special situations
    if (newSituation.firstDown) {
      playDescription += ' - FIRST DOWN';
    }
    if (newSituation.turnover) {
      playDescription += ' - TURNOVER ON DOWNS';
    }
    if (newSituation.safety) {
      playDescription += ' - SAFETY';
    }
    if (newSituation.touchdown) {
      playDescription += ' - TOUCHDOWN';
    }
    
    // Update game situation
    updateGameSituation({
      down: newSituation.down,
      distance: newSituation.distance,
      yardLine: newSituation.yardLine,
      possession: newSituation.possession || possession
    });
    
    // Add to play-by-play with explicit team information
    if (typeof addCustomPlay === 'function') {
      addCustomPlay(playDescription, currentTeam);
    }
    
    // Reset form
    setPlayData({ 
      yardage: '', 
      playType: 'rush', 
      isComplete: true, 
      thrower: '', 
      ballCarrier: '', 
      kickReceivingTeam: 'home', 
      kickFieldSide: 'home',
      kickYardLine: '',
      fieldDirection: 'home'
    });
  };

  // Delete individual play
  const deletePlay = (playIndex) => {
    if (typeof deletePlayByPlay === 'function') {
      deletePlayByPlay(playIndex);
    } else {
      alert(`Delete functionality needs to be passed as a prop. Please add deletePlayByPlay function to parent component.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Roster Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Roster Management</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowKickerModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <span>⚽</span>
              Assign Kickers
            </button>
            <button
              onClick={() => setShowRosterModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Users size={16} />
              Manage Rosters
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">{homeTeam} ({rosters.home.length} players)</h4>
            <div className="max-h-32 overflow-y-auto text-sm">
              {rosters.home.slice(0, 5).map(player => (
                <div key={player.id} className="flex justify-between">
                  <span>#{player.number} {player.name}</span>
                  <span className="text-gray-500">{player.position}</span>
                </div>
              ))}
              {rosters.home.length > 5 && <div className="text-gray-500">...and {rosters.home.length - 5} more</div>}
            </div>
            {getKickerName('home') && (
              <div className="mt-2 p-2 bg-orange-100 rounded text-sm">
                <span className="font-medium">Kicker:</span> {getKickerName('home')}
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">{awayTeam} ({rosters.away.length} players)</h4>
            <div className="max-h-32 overflow-y-auto text-sm">
              {rosters.away.slice(0, 5).map(player => (
                <div key={player.id} className="flex justify-between">
                  <span>#{player.number} {player.name}</span>
                  <span className="text-gray-500">{player.position}</span>
                </div>
              ))}
              {rosters.away.length > 5 && <div className="text-gray-500">...and {rosters.away.length - 5} more</div>}
            </div>
            {getKickerName('away') && (
              <div className="mt-2 p-2 bg-orange-100 rounded text-sm">
                <span className="font-medium">Kicker:</span> {getKickerName('away')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Play Entry */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Enhanced Play Entry</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Play Type</label>
            <select
              value={playData.playType}
              onChange={(e) => setPlayData({...playData, playType: e.target.value})}
              className="w-full p-2 border rounded disabled:bg-gray-100"
              disabled={!isConnected}
            >
              <option value="rush">Rush</option>
              <option value="pass">Pass</option>
              <option value="kickoff">Kickoff</option>
              <option value="punt">Punt</option>
            </select>
          </div>
          
          {playData.playType === 'pass' && !isStartingPlay() && (
            <div>
              <label className="block text-sm font-medium mb-1">Thrower # (QB)</label>
              <select
                value={playData.thrower}
                onChange={(e) => setPlayData({...playData, thrower: e.target.value})}
                className="w-full p-2 border rounded disabled:bg-gray-100"
                disabled={!isConnected}
              >
                <option value="">Select QB</option>
                {getPlayersByPosition(['QB']).map(player => (
                  <option key={player.id} value={player.number}>
                    #{player.number} {player.name} ({player.position})
                  </option>
                ))}
                <optgroup label="Other Players">
                  {getPlayersByPosition(['WR', 'RB', 'TE', 'FB']).map(player => (
                    <option key={player.id} value={player.number}>
                      #{player.number} {player.name} ({player.position})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
          
          {!isStartingPlay() && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {playData.playType === 'pass' ? 'Receiver # (WR/RB/TE)' : 'Ball Carrier # (QB/RB/WR)'}
              </label>
              <select
                value={playData.ballCarrier}
                onChange={(e) => setPlayData({...playData, ballCarrier: e.target.value})}
                className="w-full p-2 border rounded disabled:bg-gray-100"
                disabled={!isConnected}
              >
                <option value="">Select Player</option>
                {playData.playType === 'pass' ? (
                  <>
                    {getPlayersByPosition(['WR']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} (WR)
                      </option>
                    ))}
                    {getPlayersByPosition(['RB', 'FB']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} ({player.position})
                      </option>
                    ))}
                    {getPlayersByPosition(['TE']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} (TE)
                      </option>
                    ))}
                    <optgroup label="Other Offensive Players">
                      {getCurrentRoster().filter(player => 
                        !['WR', 'RB', 'FB', 'TE', 'QB'].includes(player.position?.toUpperCase())
                      ).map(player => (
                        <option key={player.id} value={player.number}>
                          #{player.number} {player.name} ({player.position})
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <>
                    {getPlayersByPosition(['QB']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} (QB)
                      </option>
                    ))}
                    {getPlayersByPosition(['RB', 'FB']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} ({player.position})
                      </option>
                    ))}
                    {getPlayersByPosition(['WR']).map(player => (
                      <option key={player.id} value={player.number}>
                        #{player.number} {player.name} (WR)
                      </option>
                    ))}
                    <optgroup label="Other Offensive Players">
                      {getCurrentRoster().filter(player => 
                        !['WR', 'RB', 'FB', 'QB'].includes(player.position?.toUpperCase())
                      ).map(player => (
                        <option key={player.id} value={player.number}>
                          #{player.number} {player.name} ({player.position})
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          )}
          
          {isStartingPlay() ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Receiving Team</label>
                <select
                  value={playData.kickReceivingTeam}
                  onChange={(e) => setPlayData({...playData, kickReceivingTeam: e.target.value})}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                >
                  <option value="home">{homeTeam}</option>
                  <option value="away">{awayTeam}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field Side</label>
                <select
                  value={playData.kickFieldSide}
                  onChange={(e) => setPlayData({...playData, kickFieldSide: e.target.value})}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                  title="Which team's side of the field?"
                >
                  <option value="home">{homeTeam} side</option>
                  <option value="away">{awayTeam} side</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {playData.kickFieldSide === 'home' ? homeTeam : awayTeam} Yard Line
                </label>
                <input
                  type="number"
                  min="1"
                  max="49"
                  value={playData.kickYardLine}
                  onChange={(e) => setPlayData({...playData, kickYardLine: e.target.value})}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                  placeholder="e.g. 25"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Actual field position: {playData.kickFieldSide === 'home' ? playData.kickYardLine : playData.kickYardLine ? 100 - parseInt(playData.kickYardLine) : ''}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Yardage (or "X" for incomplete)</label>
                <input
                  type="text"
                  value={playData.yardage}
                  onChange={(e) => setPlayData({...playData, yardage: e.target.value})}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                  placeholder="e.g. 5, -2, X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Field Direction</label>
                <select
                  value={playData.fieldDirection}
                  onChange={(e) => setPlayData({...playData, fieldDirection: e.target.value})}
                  className="w-full p-2 border rounded disabled:bg-gray-100"
                  disabled={!isConnected}
                  title="Which direction is positive yardage?"
                >
                  <option value="home">Toward {homeTeam} Goal</option>
                  <option value="away">Toward {awayTeam} Goal</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={processPlay}
            disabled={!isConnected || (!playData.yardage && !isStartingPlay()) || (isStartingPlay() && !playData.kickYardLine)}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={16} />
            Add Play
          </button>
          
          <button
            onClick={() => {
              const newPossession = possession === 'home' ? 'away' : 'home';
              updateGameSituation({ 
                possession: newPossession,
                down: 1,
                distance: 10
              });
            }}
            disabled={!isConnected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            Switch Possession
          </button>
        </div>
      </div>

      {/* Enhanced Play-by-Play with Delete */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Play-by-Play with Controls</h3>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {playByPlay.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No plays recorded yet</p>
          ) : (
            playByPlay.map((play, index) => (
              <div key={index} className="p-3 border rounded flex justify-between items-start">
                <div className="flex-1">
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
                <button
                  onClick={() => deletePlay(index)}
                  className="ml-2 text-red-600 hover:text-red-800 p-1"
                  title="Delete this play"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Player Lookup */}
      <PlayerLookup
        rosters={rosters}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      {/* Player Statistics */}
      <PlayerStatsManager
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        playByPlay={playByPlay}
        rosters={rosters}
      />

      {/* Kicker Assignment Modal */}
      {showKickerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Team Kickers</h2>
              <button
                onClick={() => setShowKickerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Team Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setKickerEditingTeam('home')}
                className={`px-4 py-2 rounded ${kickerEditingTeam === 'home' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
              >
                {homeTeam}
              </button>
              <button
                onClick={() => setKickerEditingTeam('away')}
                className={`px-4 py-2 rounded ${kickerEditingTeam === 'away' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
              >
                {awayTeam}
              </button>
            </div>
            
            {/* Current Kicker Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Current {kickerEditingTeam === 'home' ? homeTeam : awayTeam} Kicker:</h3>
              <div className="text-lg">
                {getKickerName(kickerEditingTeam) || 'No kicker assigned'}
              </div>
            </div>
            
            {/* Available Players */}
            <div className="border rounded max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Number</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Position</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Show Kickers first */}
                  {rosters[kickerEditingTeam].filter(player => 
                    player.position?.toLowerCase() === 'k'
                  ).map((player) => (
                    <tr key={player.id} className="border-t bg-orange-50">
                      <td className="p-2">#{player.number}</td>
                      <td className="p-2">{player.name}</td>
                      <td className="p-2">{player.position}</td>
                      <td className="p-2">
                        <button
                          onClick={() => assignKicker(kickerEditingTeam, player.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            assignedKickers[kickerEditingTeam] === player.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          {assignedKickers[kickerEditingTeam] === player.id ? 'Current' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Show other players */}
                  {rosters[kickerEditingTeam].filter(player => 
                    player.position?.toLowerCase() !== 'k'
                  ).map((player) => (
                    <tr key={player.id} className="border-t">
                      <td className="p-2">#{player.number}</td>
                      <td className="p-2">{player.name}</td>
                      <td className="p-2">{player.position}</td>
                      <td className="p-2">
                        <button
                          onClick={() => assignKicker(kickerEditingTeam, player.id)}
                          className={`px-3 py-1 rounded text-sm ${
                            assignedKickers[kickerEditingTeam] === player.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {assignedKickers[kickerEditingTeam] === player.id ? 'Current' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rosters[kickerEditingTeam].length === 0 && (
                <div className="text-gray-500 text-center py-4">No players available. Add players to the roster first.</div>
              )}
            </div>
            
            {/* Clear Kicker Assignment */}
            {assignedKickers[kickerEditingTeam] && (
              <div className="mt-4">
                <button
                  onClick={() => assignKicker(kickerEditingTeam, null)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Clear Kicker Assignment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roster Management Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Roster Management</h2>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Team Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setEditingTeam('home')}
                className={`px-4 py-2 rounded ${editingTeam === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {homeTeam}
              </button>
              <button
                onClick={() => setEditingTeam('away')}
                className={`px-4 py-2 rounded ${editingTeam === 'away' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {awayTeam}
              </button>
            </div>
            
            {/* Add Player Form */}
            <div className="grid grid-cols-4 gap-2 mb-4 p-4 bg-gray-50 rounded">
              <input
                type="text"
                placeholder="Number"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Position (QB, RB, WR, K, etc.)"
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
                className="p-2 border rounded"
              />
              <button
                onClick={addPlayer}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            
            {/* CSV Import/Export */}
            <div className="flex gap-2 mb-4">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer flex items-center gap-2">
                <Upload size={16} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => exportRoster(editingTeam)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            
            {/* Roster List */}
            <div className="border rounded max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Number</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Position</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rosters[editingTeam].map((player) => (
                    <tr key={player.id} className="border-t">
                      <td className="p-2">#{player.number}</td>
                      <td className="p-2">{player.name}</td>
                      <td className="p-2">{player.position}</td>
                      <td className="p-2">
                        <button
                          onClick={() => removePlayer(editingTeam, player.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rosters[editingTeam].length === 0 && (
                <div className="text-gray-500 text-center py-4">No players added yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsManager;