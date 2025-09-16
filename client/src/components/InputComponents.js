// components/InputComponents.js - Fixed to prevent focus loss
import React, { useState, useRef, useEffect } from 'react';

export const SimpleTextInput = ({ initialValue, onSave, placeholder, disabled, onFocusChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef();

  const handleSave = () => {
    const value = inputRef.current.value;
    onSave(value);
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            defaultValue={initialValue}
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
          {initialValue || placeholder}
        </div>
      )}
    </div>
  );
};

export const SimpleNumberInput = ({ initialValue, onSave, disabled, onFocusChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef();

  const handleSave = () => {
    const inputValue = inputRef.current.value;
    // Parse as number but preserve negative values and handle empty/invalid input
    const numericValue = inputValue === '' || inputValue === '-' ? 0 : Number(inputValue);
    // Ensure we get a valid number (including negatives)
    const finalValue = isNaN(numericValue) ? 0 : numericValue;
    onSave(finalValue);
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="number"
            defaultValue={initialValue}
            className="w-full p-2 border rounded"
            autoFocus
            step="1"
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
          {initialValue}
        </div>
      )}
    </div>
  );
};

export const SimpleTextarea = ({ initialValue, onSave, placeholder, disabled, onFocusChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef();

  const handleSave = () => {
    const value = textareaRef.current.value;
    onSave(value);
    setIsEditing(false);
    onFocusChange(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onFocusChange(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            defaultValue={initialValue}
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
          {initialValue || placeholder}
        </div>
      )}
    </div>
  );
};