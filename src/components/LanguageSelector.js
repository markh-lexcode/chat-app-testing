import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LanguageSelector.css';

const LanguageSelector = ({ userId, eventId }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const languages = [
    'English',
    'Filipino',
    'Korean',
    'Japanese',
    'Arabic',
    'French',
    'Hindi',
    'Russian',
    'Polish',
    'Swedish'
  ];

  useEffect(() => {
    // Fetch user's current language preference if it exists
    const fetchCurrentPreference = async () => {
      try {
        const response = await axios.get(
          // `http://localhost:5000/language-preferences/${eventId}?user_id=${userId}`
          `https://qurious.ddns.net/qurious-engagement/api/language-preferences/${eventId}?user_id=${userId}`
        );

        // Find this user's preference
        const userPref = response.data.find(pref => pref.user_id === userId);
        if (userPref) {
          setSelectedLanguage(userPref.language);
        }
      } catch (error) {
        console.error('Error fetching language preference:', error);
      }
    };

    if (userId && eventId) {
      fetchCurrentPreference();
    }
  }, [userId, eventId]);

  const handleLanguageChange = async (e) => {
    const language = e.target.value;
    setSelectedLanguage(language);
    setIsSaving(true);

    try {
      // await axios.post('http://localhost:5000/language-preference', {
        await axios.post('https://qurious.ddns.net/qurious-engagement/api/language-preference', {
        user_id: userId,
        event_id: eventId,
        language
      });
    } catch (error) {
      console.error('Error saving language preference:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Select your preferred language:</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={isSaving}
      >
        <option value="">-- Select Language --</option>
        {languages.map(language => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
      {isSaving && <span className="saving-indicator">Saving...</span>}
    </div>
  );
};

export default LanguageSelector;