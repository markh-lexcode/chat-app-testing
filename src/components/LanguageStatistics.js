import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './LanguageStatistics.css';

// Reuse the socket connection
// const socket = io('http://localhost:5000', {
//   transports: ['websocket']
// });

const socket = io('wss://qurious.ddns.net', {
  path: '/qurious-engagement/socket.io/',
  transports: ['websocket']
});

const LanguageStatistics = ({ eventId, role }) => {
  const [languageCounts, setLanguageCounts] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  // Function to ensure all languages are represented in the data
  const normalizeLanguageCounts = (counts) => {
    const normalized = [...counts];

    // Add missing languages with count 0
    languages.forEach(lang => {
      if (!normalized.some(item => item.language === lang)) {
        normalized.push({ language: lang, count: 0 });
      }
    });

    // Sort by count (descending) then by language name
    normalized.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.language.localeCompare(b.language);
    });

    return normalized;
  };

  useEffect(() => {
    if (!eventId) return;

    const fetchLanguageCounts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          // `http://localhost:5000/language-preferences/${eventId}`
          `https://qurious.ddns.net/qurious-engagement/api/language-preferences/${eventId}`
        );

        const normalized = normalizeLanguageCounts(response.data);
        setLanguageCounts(normalized);

        // Calculate total
        const total = normalized.reduce((sum, item) => sum + item.count, 0);
        setTotalParticipants(total);
      } catch (error) {
        console.error('Error fetching language counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLanguageCounts();

    // Join event-specific room for real-time updates
    socket.emit('join_event', { event_id: eventId, role: role });

    // Listen for updates
    socket.on('language_counts_update', (data) => {
      if (data.event_id === eventId) {
        const normalized = normalizeLanguageCounts(data.counts);
        setLanguageCounts(normalized);

        // Update total
        const total = normalized.reduce((sum, item) => sum + item.count, 0);
        setTotalParticipants(total);
      }
    });

    return () => {
      // Leave the event room when component unmounts or event changes
      socket.emit('leave_event', { event_id: eventId, role: role });
      socket.off('language_counts_update');
    };
  }, [eventId]);

  // Calculate percentage
  const getPercentage = (count) => {
    if (totalParticipants === 0) return 0;
    return Math.round((count / totalParticipants) * 100);
  };

  if (isLoading) {
    return <div className="language-statistics loading">Loading language statistics...</div>;
  }

  return (
    <div className="language-statistics">
      <h2>Real-Time Language Preferences</h2>
      <div className="statistics-event-info">
        <p>Event ID: {eventId}</p>
        <p>Total Participants: {totalParticipants}</p>
      </div>

      <div className="language-chart">
        {languageCounts.map(item => (
          <div key={item.language} className="language-bar-container">
            <div className="language-label">
              <span className="language-name">{item.language}</span>
              <span className="language-count">
                {item.count} ({getPercentage(item.count)}%)
              </span>
            </div>
            <div className="language-bar-background">
              <div
                className="language-bar"
                style={{ width: `${getPercentage(item.count)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageStatistics;