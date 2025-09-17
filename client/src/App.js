// App.js - Main application component
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LoginView from './components/LoginView';
import GamecastView from './components/GamecastView';
import ScorekeeperView from './components/ScorekeeperView';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const FootballScorekeeper = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Connection state
  const [isConnected, setIsConnected] = useState(true);

  // Game state
  const [gameId, setGameId] = useState(null);
  const [homeTeam, setHomeTeam] = useState('Home Team');
  const [awayTeam, setAwayTeam] = useState('Away Team');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  // Game time state
  const [quarter, setQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isClockRunning, setIsClockRunning] = useState(false);
  
  // Game details
  const [down, setDown] = useState(1);
  const [distance, setDistance] = useState(10);
  const [yardLine, setYardLine] = useState(50);
  const [possession, setPossession] = useState('home');
  const [timeouts, setTimeouts] = useState({ home: 3, away: 3 });
  
  // Play by play
  const [playByPlay, setPlayByPlay] = useState([]);
  const [currentPlay, setCurrentPlay] = useState('');
  
  // View mode
  const [viewMode, setViewMode] = useState('gamecast');

  // Critical fix: Track if ANY input is focused to pause polling
  const [isAnyInputFocused, setIsAnyInputFocused] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Kicker assignments and rosters state
  const [assignedKickers, setAssignedKickers] = useState({
    home: null,
    away: null
  });

  const [rosters, setRosters] = useState({
    home: [],
    away: []
  });

  // Load rosters from localStorage on mount
  useEffect(() => {
    const savedRosters = localStorage.getItem('football-rosters');
    if (savedRosters) {
      try {
        setRosters(JSON.parse(savedRosters));
      } catch (error) {
        console.error('Error loading rosters:', error);
      }
    }
  }, []);

  // Load kicker assignments from localStorage
  useEffect(() => {
    const savedKickers = localStorage.getItem('football-kickers');
    if (savedKickers) {
      try {
        setAssignedKickers(JSON.parse(savedKickers));
      } catch (error) {
        console.error('Error loading kickers:', error);
      }
    }
  }, []);

  // Save kicker assignments to localStorage
  const saveKickers = (newKickers) => {
    setAssignedKickers(newKickers);
    localStorage.setItem('football-kickers', JSON.stringify(newKickers));
  };

  // Save rosters to localStorage
  const saveRosters = (newRosters) => {
    setRosters(newRosters);
    localStorage.setItem('football-rosters', JSON.stringify(newRosters));
  };

  // API helper
  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Handle input focus changes from child components
  const handleInputFocusChange = (isFocused) => {
    setIsAnyInputFocused(isFocused);
  };

  // Check authentication on mount
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp > Date.now() / 1000) {
          setIsAuthenticated(true);
          setCurrentUser({ username: payload.username, role: payload.role });
          api.defaults.headers.Authorization = `Bearer ${token}`;
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (e) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token]);

  // Load data with polling that STOPS when inputs are focused
  const loadGameData = async (forceUpdate = false) => {
    try {
      const gameResponse = await api.get('/api/game');
      const game = gameResponse.data;
      
      if (game.id) {
        setGameId(game.id);
        
        // Always update these values (but polling will be paused during input focus)
        setHomeTeam(game.home_team || 'Home Team');
        setAwayTeam(game.away_team || 'Away Team');
        setHomeScore(game.home_score || 0);
        setAwayScore(game.away_score || 0);
        setQuarter(game.quarter || 1);
        setTimeLeft(game.time_left || 900);
        setIsClockRunning(game.is_clock_running || false);
        setDown(game.down || 1);
        setDistance(game.distance || 10);
        setYardLine(game.yard_line || 50);
        setPossession(game.possession || 'home');
        setTimeouts({ 
          home: game.home_timeouts ?? 3, 
          away: game.away_timeouts ?? 3 
        });

        // Load plays
        const playsResponse = await api.get(`/api/plays/${game.id}`);
        setPlayByPlay(playsResponse.data.map(play => ({
          id: play.id,
          time: `Q${play.quarter} ${formatTime(play.game_time)}`,
          timestamp: new Date(play.timestamp).toLocaleTimeString(),
          description: play.play_text, // For StatsManager/ScorekeeperView
          play: play.play_text, // For GamecastView compatibility
          team: play.team || (play.possession === 'home' ? game.home_team || homeTeam : game.away_team || awayTeam),
          quarter: play.quarter,
          gameTime: play.game_time
        })));
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to load game data:', error);
      setIsConnected(false);
    }
  };

  // Smart polling that pauses when inputs are focused
  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        // Only poll if no inputs are focused
        if (!isAnyInputFocused) {
          loadGameData(false);
        }
      }, 2000);
    };

    loadGameData(true); // Initial load
    startPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAnyInputFocused]); // Restart polling when focus state changes

  // Update game function
  const updateGame = async (updates) => {
    console.log('updateGame called with:', updates, 'gameId:', gameId);
    
    if (!gameId) {
      console.log('No gameId, skipping update');
      return;
    }
    
    try {
      console.log('Making API call to:', `/api/game/${gameId}`);
      const response = await api.put(`/api/game/${gameId}`, updates);
      console.log('API response:', response.data);
      setIsConnected(true);
      
      // Don't automatically reload data after team name updates to prevent conflicts
      if (!updates.home_team && !updates.away_team) {
        setTimeout(() => loadGameData(false), 300);
      }
    } catch (error) {
      console.error('Failed to update game:', error);
      setIsConnected(false);
    }
  };

  // Add play to database
  const addPlayToDB = async (playText, team = null) => {
    if (!gameId) return;
    
    // Determine the correct team name based on possession if not explicitly provided
    const teamName = team || (possession === 'home' ? homeTeam : awayTeam);
    
    try {
      await api.post('/api/plays', {
        game_id: gameId,
        play_text: playText,
        team: teamName,
        quarter,
        game_time: timeLeft,
        possession
      });
      setIsConnected(true);
      // Reload plays to get the updated list
      setTimeout(() => loadGameData(false), 100);
    } catch (error) {
      console.error('Failed to add play:', error);
      setIsConnected(false);
    }
  };

  // Delete play from database
  const deletePlayByPlay = async (playIndex) => {
    console.log('deletePlayByPlay called with index:', playIndex);
    console.log('playByPlay array length:', playByPlay.length);
    
    if (!gameId || playIndex < 0 || playIndex >= playByPlay.length) {
      console.log('Invalid conditions - gameId:', gameId, 'playIndex:', playIndex);
      return;
    }
    
    const playToDelete = playByPlay[playIndex];
    console.log('Play to delete:', playToDelete);
    
    if (!playToDelete.id) {
      console.error('Play has no ID, cannot delete');
      return;
    }
    
    try {
      console.log('Attempting to delete play with ID:', playToDelete.id);
      const response = await api.delete(`/api/plays/${playToDelete.id}`);
      console.log('Delete response:', response.data);
      setIsConnected(true);
      // Reload plays to get the updated list
      console.log('Reloading game data...');
      setTimeout(() => loadGameData(false), 500); // Increased timeout
    } catch (error) {
      console.error('Failed to delete play:', error);
      console.error('Error response:', error.response?.data);
      setIsConnected(false);
    }
  };

  // Clock effect with database sync
  useEffect(() => {
    let interval;
    if (isClockRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev <= 1 ? 0 : prev - 1;
          if (newTime === 0) {
            setIsClockRunning(false);
            updateGame({ time_left: newTime, is_clock_running: false });
          } else {
            updateGame({ time_left: newTime });
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, timeLeft, gameId]);

  // Sync clock state changes
  useEffect(() => {
    if (gameId) {
      updateGame({ is_clock_running: isClockRunning });
    }
  }, [isClockRunning, gameId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setViewMode('gamecast');
    delete api.defaults.headers.Authorization;
  };

  const addScore = async (team, points, playDescription = '') => {
    const newHomeScore = team === 'home' ? homeScore + points : homeScore;
    const newAwayScore = team === 'away' ? awayScore + points : awayScore;
    
    setHomeScore(newHomeScore);
    setAwayScore(newAwayScore);
    
    const scoreText = points === 6 ? 'TOUCHDOWN' : points === 3 ? 'FIELD GOAL' : points === 2 ? 'SAFETY' : `${points} POINT${points !== 1 ? 'S' : ''}`;
    const playText = playDescription || `${scoreText} - ${team === 'home' ? homeTeam : awayTeam}`;
    
    await updateGame({ home_score: newHomeScore, away_score: newAwayScore });
    await addPlayToDB(playText, team === 'home' ? homeTeam : awayTeam);
  };

  const nextDown = async () => {
    const newDown = down < 4 ? down + 1 : 1;
    const newPossession = down >= 4 ? (possession === 'home' ? 'away' : 'home') : possession;
    const newDistance = down >= 4 ? 10 : distance;
    
    setDown(newDown);
    setPossession(newPossession);
    setDistance(newDistance);
    
    await updateGame({ 
      down: newDown, 
      possession: newPossession, 
      distance: newDistance 
    });
    
    if (down >= 4) {
      await addPlayToDB(`Turnover on downs - ${newPossession === 'home' ? homeTeam : awayTeam} takes possession`);
    }
  };

  const firstDown = async () => {
    setDown(1);
    setDistance(10);
    await updateGame({ down: 1, distance: 10 });
    await addPlayToDB(`FIRST DOWN - ${possession === 'home' ? homeTeam : awayTeam}`);
  };

  const nextQuarter = async () => {
    if (quarter < 4) {
      const newQuarter = quarter + 1;
      const newTimeouts = { home: 3, away: 3 };
      
      setQuarter(newQuarter);
      setTimeLeft(15 * 60);
      setTimeouts(newTimeouts);
      
      await updateGame({ 
        quarter: newQuarter, 
        time_left: 15 * 60,
        home_timeouts: 3,
        away_timeouts: 3
      });
      await addPlayToDB(`End of Quarter ${quarter}`);
    }
  };

  const useTimeout = async (team) => {
    if (timeouts[team] > 0) {
      const newTimeouts = { ...timeouts, [team]: timeouts[team] - 1 };
      setTimeouts(newTimeouts);
      setIsClockRunning(false);
      
      await updateGame({ 
        [`${team}_timeouts`]: newTimeouts[team],
        is_clock_running: false
      });
      await addPlayToDB(`Timeout - ${team === 'home' ? homeTeam : awayTeam}`);
    }
  };

  const resetGame = async () => {
    try {
      await api.post('/api/game/reset');
      await loadGameData(true);
    } catch (error) {
      console.error('Failed to reset game:', error);
      setIsConnected(false);
    }
  };

  const updateTeamName = async (team, name) => {
    console.log('Updating team name:', team, 'to:', name);
    
    if (team === 'home') {
      setHomeTeam(name);
      console.log('Calling updateGame with:', { home_team: name });
      await updateGame({ home_team: name });
    } else {
      setAwayTeam(name);
      console.log('Calling updateGame with:', { away_team: name });
      await updateGame({ away_team: name });
    }
  };

  const updateGameSituation = async (updates) => {
    Object.keys(updates).forEach(key => {
      if (key === 'down') setDown(updates[key]);
      if (key === 'distance') setDistance(updates[key]);
      if (key === 'yardLine' || key === 'yard_line') setYardLine(updates[key]);
      if (key === 'possession') setPossession(updates[key]);
      if (key === 'time_left') setTimeLeft(updates[key]);
      if (key === 'quarter') setQuarter(updates[key]);
      if (key === 'home_score') setHomeScore(updates[key]);
      if (key === 'away_score') setAwayScore(updates[key]);
    });
    
    // Convert camelCase to snake_case for API
    const apiUpdates = {};
    Object.keys(updates).forEach(key => {
      if (key === 'yardLine') {
        apiUpdates.yard_line = updates[key];
      } else {
        apiUpdates[key] = updates[key];
      }
    });
    
    await updateGame(apiUpdates);
  };

  const addCustomPlay = async (playText, team = null) => {
    if (playText && playText.trim()) {
      await addPlayToDB(playText.trim(), team);
      setCurrentPlay('');
    }
  };

  // Main render logic
  if (viewMode === 'login') {
    return (
      <LoginView
        api={api}
        setToken={setToken}
        setIsAuthenticated={setIsAuthenticated}
        setCurrentUser={setCurrentUser}
        setViewMode={setViewMode}
        setIsConnected={setIsConnected}
      />
    );
  }
  
  if (viewMode === 'gamecast') {
    return (
      <GamecastView
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
        quarter={quarter}
        timeLeft={timeLeft}
        down={down}
        distance={distance}
        yardLine={yardLine}
        possession={possession}
        timeouts={timeouts}
        playByPlay={playByPlay}
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        setViewMode={setViewMode}
        handleLogout={handleLogout}
        formatTime={formatTime}
      />
    );
  }
  
  if (viewMode === 'scorekeeper' && isAuthenticated) {
    return (
      <ScorekeeperView
        currentUser={currentUser}
        isConnected={isConnected}
        isAnyInputFocused={isAnyInputFocused}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
        quarter={quarter}
        timeLeft={timeLeft}
        isClockRunning={isClockRunning}
        down={down}
        distance={distance}
        yardLine={yardLine}
        possession={possession}
        timeouts={timeouts}
        currentPlay={currentPlay}
        playByPlay={playByPlay}
        assignedKickers={assignedKickers}
        rosters={rosters}
        setViewMode={setViewMode}
        resetGame={resetGame}
        handleLogout={handleLogout}
        updateTeamName={updateTeamName}
        addScore={addScore}
        useTimeout={useTimeout}
        setIsClockRunning={setIsClockRunning}
        updateGameSituation={updateGameSituation}
        nextDown={nextDown}
        firstDown={firstDown}
        nextQuarter={nextQuarter}
        setCurrentPlay={setCurrentPlay}
        addCustomPlay={addCustomPlay}
        deletePlayByPlay={deletePlayByPlay}
        formatTime={formatTime}
        onInputFocusChange={handleInputFocusChange}
        saveKickers={saveKickers}
        saveRosters={saveRosters}
      />
    );
  }
  
  // Default to gamecast view
  return (
    <GamecastView
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      homeScore={homeScore}
      awayScore={awayScore}
      quarter={quarter}
      timeLeft={timeLeft}
      down={down}
      distance={distance}
      yardLine={yardLine}
      possession={possession}
      timeouts={timeouts}
      playByPlay={playByPlay}
      isConnected={isConnected}
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      setViewMode={setViewMode}
      handleLogout={handleLogout}
      formatTime={formatTime}
    />
  );
};

export default FootballScorekeeper;