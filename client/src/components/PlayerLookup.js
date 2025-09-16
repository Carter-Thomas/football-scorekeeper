// components/PlayerLookup.js
import React, { useState, useEffect } from 'react';
import { Search, User, Users } from 'lucide-react';

const PlayerLookup = ({ rosters, homeTeam, awayTeam }) => {
  const [searchNumber, setSearchNumber] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (number) => {
    setSearchNumber(number);
    
    if (!number.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    
    // Search in both teams
    ['home', 'away'].forEach(team => {
      if (rosters[team]) {
        const foundPlayers = rosters[team].filter(player => 
          player.number.toString() === number.toString()
        );
        
        foundPlayers.forEach(player => {
          results.push({
            ...player,
            teamName: team === 'home' ? homeTeam : awayTeam,
            teamKey: team
          });
        });
      }
    });
    
    setSearchResults(results);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Search size={20} />
        Player Lookup
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Player Number</label>
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Enter player # (e.g. 12)"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {searchNumber && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-800">
                  <User size={16} />
                  <span className="font-medium">Player #{searchNumber} not found</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Check the number or make sure the player is added to a roster.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Found {searchResults.length} player(s):
                </h4>
                {searchResults.map((player, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-green-600" />
                        <div>
                          <span className="font-medium text-green-800">
                            #{player.number} {player.name}
                          </span>
                          <div className="text-sm text-green-600">
                            {player.position} • {player.teamName}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        player.teamKey === 'home' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {player.teamKey === 'home' ? 'HOME' : 'AWAY'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!searchNumber && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={16} />
              <span className="text-sm">Enter a player number to search both teams</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLookup;