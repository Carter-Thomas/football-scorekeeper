// components/PlayerStatsManager.js
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, User, Trophy, Play, Clock } from 'lucide-react';

const PlayerStatsManager = ({ 
  homeTeam, 
  awayTeam, 
  playByPlay,
  rosters // Passed from StatsManager
}) => {
  const [playerPlays, setPlayerPlays] = useState({}); // Track individual plays per player
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState(null); // For detailed view
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'plays'

  // Helper function to check if player is offensive
  const isOffensivePlayer = (position) => {
    if (!position) return true; // Default to showing if position unknown
    const pos = position.toLowerCase();
    const defensivePositions = ['db', 'lb', 'dl', 'cb', 'fs', 'ss', 'olb', 'mlb', 'ilb', 'de', 'dt', 'nt'];
    return !defensivePositions.some(defPos => pos.includes(defPos));
  };

  // Initialize player structure from rosters
  useEffect(() => {
    const initPlays = {};
    
    ['home', 'away'].forEach(team => {
      if (rosters[team]) {
        rosters[team].forEach(player => {
          // Only include offensive players
          if (isOffensivePlayer(player.position)) {
            initPlays[`${team}-${player.number}`] = {
              name: player.name,
              number: player.number,
              position: player.position,
              team: team,
              plays: [] // All plays involving this player
            };
          }
        });
      }
    });
    
    setPlayerPlays(initPlays);
  }, [rosters]);

  // Parse play descriptions to extract individual plays
  useEffect(() => {
    if (!playByPlay || playByPlay.length === 0) return;

    // Reset plays to initial state first
    const resetPlays = {};
    
    ['home', 'away'].forEach(team => {
      if (rosters[team]) {
        rosters[team].forEach(player => {
          // Only include offensive players
          if (isOffensivePlayer(player.position)) {
            const playerKey = `${team}-${player.number}`;
            resetPlays[playerKey] = {
              name: player.name,
              number: player.number,
              position: player.position,
              team: team,
              plays: []
            };
          }
        });
      }
    });
    
    // Parse all plays fresh
    playByPlay.forEach((play, index) => {
      const description = play.description || play.play;
      if (!description) return;

      parsePlayForPlayers(description, play.team, resetPlays, play.time, index);
    });

    setPlayerPlays(resetPlays);
  }, [playByPlay, rosters, homeTeam, awayTeam]);

  const parsePlayForPlayers = (description, team, plays, time, playIndex) => {
    const teamKey = team === homeTeam ? 'home' : 'away';
    
    // Parse rushing plays: "Player Name +X yard rush" or "Player Name -X yard rush"
    const rushMatch = description.match(/^(.+?)\s*([+-]?\d+)\s*yard\s+rush/);
    if (rushMatch) {
      const playerName = rushMatch[1].trim();
      const yardsStr = rushMatch[2]; // Keep as string to preserve sign
      const yards = parseInt(yardsStr); // This now properly handles negative signs
      const isTouchdown = description.includes('TOUCHDOWN');
      
      addPlayerPlay(plays, teamKey, playerName, {
        type: 'rushing',
        yards: yards,
        description: description,
        time: time,
        playIndex: playIndex,
        touchdown: isTouchdown,
        result: isTouchdown ? 'TD' : yards > 0 ? 'gain' : 'loss'
      });
      return;
    }

    // Parse passing plays: "QB +X yard pass to Receiver" or "QB -X yard pass to Receiver"
    const passMatch = description.match(/^(.+?)\s*([+-]?\d+)\s*yard\s+pass\s+to\s+(.+?)\s*\((complete|incomplete)\)/);
    if (passMatch) {
      const qbName = passMatch[1].trim();
      const yardsStr = passMatch[2]; // Keep as string to preserve sign
      const yards = parseInt(yardsStr); // This now properly handles negative signs
      const receiverName = passMatch[3].trim();
      const isComplete = passMatch[4] === 'complete';
      const isTouchdown = description.includes('TOUCHDOWN');
      
      // QB play
      addPlayerPlay(plays, teamKey, qbName, {
        type: 'passing',
        yards: isComplete ? yards : 0,
        description: description,
        time: time,
        playIndex: playIndex,
        complete: isComplete,
        target: receiverName,
        touchdown: isTouchdown,
        result: isTouchdown ? 'TD' : isComplete ? 'complete' : 'incomplete'
      });
      
      // Receiver play (only if complete)
      if (isComplete) {
        addPlayerPlay(plays, teamKey, receiverName, {
          type: 'receiving',
          yards: yards,
          description: description,
          time: time,
          playIndex: playIndex,
          passer: qbName,
          touchdown: isTouchdown,
          result: isTouchdown ? 'TD' : yards > 0 ? 'gain' : 'no gain'
        });
      }
      return;
    }

    // Parse incomplete passes: "QB incomplete pass intended for Receiver"
    const incompleteMatch = description.match(/^(.+?)\s*incomplete\s+pass(?:\s+intended\s+for\s+(.+?))?/);
    if (incompleteMatch) {
      const qbName = incompleteMatch[1].trim();
      const receiverName = incompleteMatch[2]?.trim() || 'Unknown';
      
      addPlayerPlay(plays, teamKey, qbName, {
        type: 'passing',
        yards: 0,
        description: description,
        time: time,
        playIndex: playIndex,
        complete: false,
        target: receiverName,
        touchdown: false,
        result: 'incomplete'
      });
      return;
    }

    // Parse other touchdown plays that mention player names
    if (description.includes('TOUCHDOWN')) {
      const tdMatch = description.match(/^(.+?)\s*(?:\+|\-)?(\d+)?\s*yard/);
      if (tdMatch) {
        const playerName = tdMatch[1].trim();
        const yards = tdMatch[2] ? parseInt(tdMatch[2]) : 0;
        
        addPlayerPlay(plays, teamKey, playerName, {
          type: 'touchdown',
          yards: yards,
          description: description,
          time: time,
          playIndex: playIndex,
          touchdown: true,
          result: 'TD'
        });
      }
    }
  };

  const addPlayerPlay = (plays, teamKey, playerName, playData) => {
    // Find player by name in the team roster
    const playerKey = Object.keys(plays).find(key => {
      const player = plays[key];
      return player && player.team === teamKey && player.name === playerName;
    });

    if (playerKey && plays[playerKey]) {
      plays[playerKey].plays.push(playData);
    }
  };

  const getTeamPlayers = (team) => {
    const teamKey = team === 'home' ? 'home' : 'away';
    return Object.values(playerPlays)
      .filter(player => player.team === teamKey)
      .sort((a, b) => b.plays.length - a.plays.length); // Sort by total plays descending
  };

  const calculatePlayerSummary = (player) => {
    const summary = {
      passingYards: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      rushingYards: 0,
      rushingAttempts: 0,
      receivingYards: 0,
      receptions: 0,
      touchdowns: 0,
      totalYards: 0
    };

    player.plays.forEach(play => {
      if (play.type === 'passing') {
        summary.passingAttempts++;
        if (play.complete) {
          summary.passingCompletions++;
          summary.passingYards += play.yards;
        }
      } else if (play.type === 'rushing') {
        summary.rushingAttempts++;
        summary.rushingYards += play.yards;
      } else if (play.type === 'receiving') {
        summary.receptions++;
        summary.receivingYards += play.yards;
      }
      
      if (play.touchdown) {
        summary.touchdowns++;
      }
    });

    summary.totalYards = summary.passingYards + summary.rushingYards + summary.receivingYards;
    summary.completionPercentage = summary.passingAttempts > 0 ? 
      ((summary.passingCompletions / summary.passingAttempts) * 100).toFixed(1) + '%' : '0%';

    return summary;
  };

  const getPositionSummaryStats = (player, summary) => {
    const pos = player.position?.toLowerCase();
    
    if (pos === 'qb') {
      return [
        { label: 'Passing', value: `${summary.passingYards} yds (${summary.passingCompletions}/${summary.passingAttempts}, ${summary.completionPercentage})` },
        { label: 'Rushing', value: `${summary.rushingYards} yds (${summary.rushingAttempts} att)` },
        { label: 'TDs', value: summary.touchdowns }
      ];
    } else if (pos === 'wr' || pos === 'rb') {
      return [
        { label: 'Rushing', value: `${summary.rushingYards} yds (${summary.rushingAttempts} att)` },
        { label: 'Receiving', value: `${summary.receivingYards} yds (${summary.receptions} rec)` },
        { label: 'TDs', value: summary.touchdowns }
      ];
    } else {
      return [
        { label: 'Total Yards', value: summary.totalYards },
        { label: 'TDs', value: summary.touchdowns }
      ];
    }
  };

  const getPlayIcon = (playType) => {
    switch (playType) {
      case 'passing': return '🎯';
      case 'rushing': return '🏃‍♂️';
      case 'receiving': return '🙌';
      case 'touchdown': return '🏈';
      default: return '▶️';
    }
  };

  const getPlayColor = (play) => {
    if (play.touchdown) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (play.type === 'passing') {
      return play.complete ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-red-100 border-red-300 text-red-800';
    }
    if (play.type === 'rushing') {
      return play.yards > 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-800';
    }
    if (play.type === 'receiving') {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    }
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const activeTeamName = activeTab === 'home' ? homeTeam : awayTeam;
  const activeTeamPlayers = getTeamPlayers(activeTab);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={20} />
          Player Statistics (Offensive Only)
        </h3>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'summary' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('plays')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'plays' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Plays
          </button>
        </div>
      </div>

      {/* Team Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-2 rounded ${activeTab === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          {homeTeam}
        </button>
        <button
          onClick={() => setActiveTab('away')}
          className={`px-4 py-2 rounded ${activeTab === 'away' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          {awayTeam}
        </button>
      </div>

      {/* Stats Display */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activeTeamPlayers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No offensive players found for {activeTeamName}</p>
        ) : (
          activeTeamPlayers.map(player => {
            const summary = calculatePlayerSummary(player);
            const hasStats = player.plays.length > 0;
            
            return (
              <div key={`${player.team}-${player.number}`} 
                   className={`p-4 border rounded ${hasStats ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <User size={16} />
                      #{player.number} {player.name}
                      {hasStats && <Trophy size={14} className="text-yellow-600" />}
                      {hasStats && <span className="text-xs bg-blue-200 px-2 py-1 rounded">{player.plays.length} plays</span>}
                    </h4>
                    <p className="text-sm text-gray-600">{player.position}</p>
                  </div>
                  {hasStats && viewMode === 'summary' && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {summary.totalYards} Total Yds
                      </div>
                      <div className="text-xs text-gray-500">
                        {summary.touchdowns} TDs
                      </div>
                    </div>
                  )}
                </div>
                
                {hasStats && viewMode === 'summary' && (
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    {getPositionSummaryStats(player, summary).map((stat, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{stat.label}:</span>
                        <span className="font-medium">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hasStats && viewMode === 'plays' && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Play size={14} />
                      Individual Plays ({player.plays.length})
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {player.plays
                        .sort((a, b) => a.playIndex - b.playIndex)
                        .map((play, idx) => (
                          <div key={idx} className={`p-3 border rounded-lg ${getPlayColor(play)}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{getPlayIcon(play.type)}</span>
                                <div className="font-bold text-sm uppercase tracking-wide">
                                  {play.type === 'passing' && (play.complete ? 'PASS COMPLETE' : 'PASS INCOMPLETE')}
                                  {play.type === 'rushing' && 'RUSHING'}
                                  {play.type === 'receiving' && 'RECEIVING'}
                                  {play.type === 'touchdown' && 'TOUCHDOWN'}
                                </div>
                                {play.touchdown && (
                                  <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                    TD!
                                  </span>
                                )}
                              </div>
                              <div className="text-right text-gray-600 flex items-center gap-1 text-xs">
                                <Clock size={12} />
                                <span className="font-medium">{play.time}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 text-sm">
                              {/* Yardage Display */}
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Yardage:</span>
                                <span className={`font-bold text-lg ${play.yards > 0 ? 'text-green-600' : play.yards < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {play.yards > 0 ? '+' : ''}{play.yards} yards
                                </span>
                              </div>

                              {/* Player Relationships */}
                              {play.type === 'passing' && (
                                <div className="bg-white bg-opacity-50 p-2 rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700">Passer:</span>
                                    <span className="font-bold text-blue-700">{player.name} #{player.number}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Target:</span>
                                    <span className="font-bold text-purple-700">{play.target || 'Unknown'}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="font-medium text-gray-700">Result:</span>
                                    <span className={`font-bold ${play.complete ? 'text-green-600' : 'text-red-600'}`}>
                                      {play.complete ? 'COMPLETED' : 'INCOMPLETE'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {play.type === 'receiving' && (
                                <div className="bg-white bg-opacity-50 p-2 rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700">Receiver:</span>
                                    <span className="font-bold text-purple-700">{player.name} #{player.number}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Passer:</span>
                                    <span className="font-bold text-blue-700">{play.passer || 'Unknown'}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="font-medium text-gray-700">Result:</span>
                                    <span className="font-bold text-green-600">CAUGHT</span>
                                  </div>
                                </div>
                              )}

                              {play.type === 'rushing' && (
                                <div className="bg-white bg-opacity-50 p-2 rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700">Runner:</span>
                                    <span className="font-bold text-green-700">{player.name} #{player.number}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Result:</span>
                                    <span className={`font-bold ${play.yards > 0 ? 'text-green-600' : play.yards < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                      {play.yards > 0 ? 'GAIN' : play.yards < 0 ? 'LOSS' : 'NO GAIN'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Full Play Description */}
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Play Description:</span>
                              </div>
                              <div className="text-xs text-gray-800 italic mt-1">
                                "{play.description}"
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {!hasStats && (
                  <p className="text-sm text-gray-500">No plays recorded</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Team Totals */}
      {activeTeamPlayers.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">{activeTeamName} Team Totals</h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            {(() => {
              const teamTotals = activeTeamPlayers.reduce((totals, player) => {
                const summary = calculatePlayerSummary(player);
                totals.passing += summary.passingYards;
                totals.rushing += summary.rushingYards;
                totals.receiving += summary.receivingYards;
                totals.touchdowns += summary.touchdowns;
                return totals;
              }, { passing: 0, rushing: 0, receiving: 0, touchdowns: 0 });

              return (
                <>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">{teamTotals.passing}</div>
                    <div className="text-gray-600">Passing Yds</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-green-600">{teamTotals.rushing}</div>
                    <div className="text-gray-600">Rushing Yds</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-purple-600">{teamTotals.receiving}</div>
                    <div className="text-gray-600">Receiving Yds</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-yellow-600">{teamTotals.touchdowns}</div>
                    <div className="text-gray-600">Total TDs</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsManager;
