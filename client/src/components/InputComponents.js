// components/InputComponents.js
import React, { useState } from 'react';

export const SimpleTextInput = ({ initialValue, onSave, placeholder, disabled, onFocusChange }) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-2 rounded"
            disabled={disabled}
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-600 text-white px-2 rounded"
          >
            ✗
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled) {
              setIsEditing(true);
              onFocusChange(true);
            }
          }}
          className={`p-2 border border-transparent rounded cursor-pointer hover:border-gray-300 ${
            disabled ? 'cursor-not-allowed text-gray-500' : ''
          }`}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
};

export const SimpleNumberInput = ({ initialValue, onSave, disabled, onFocusChange }) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(Number(value));
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-2 rounded"
            disabled={disabled}
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-600 text-white px-2 rounded"
          >
            ✗
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled) {
              setIsEditing(true);
              onFocusChange(true);
            }
          }}
          className={`p-2 border border-transparent rounded cursor-pointer hover:border-gray-300 ${
            disabled ? 'cursor-not-allowed text-gray-500' : ''
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
};

export const SimpleTextarea = ({ initialValue, onSave, placeholder, disabled, onFocusChange }) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-3 py-1 rounded"
              disabled={disabled}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled) {
              setIsEditing(true);
              onFocusChange(true);
            }
          }}
          className={`p-2 border border-transparent rounded cursor-pointer hover:border-gray-300 ${
            disabled ? 'cursor-not-allowed text-gray-500' : ''
          }`}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
};