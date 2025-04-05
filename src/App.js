import React, { useState, useEffect } from 'react';
import ChatSystem from './components/ChatSystem';
import LanguageSelector from './components/LanguageSelector';
import LanguageStatistics from './components/LanguageStatistics';
import './App.css';

function App() {
  // Mock current user - in real app, this would come from authentication
  const [currentUser, setCurrentUser] = useState({
    _id: prompt("Enter your ID:") || "67b4295653f1cc90f6735289",
    role: prompt("Enter your role:") || "admin"
  });

  const [currentPage, setCurrentPage] = useState('chat');
  const [eventId, setEventId] = useState('event_004'); // Mock event ID, in real app would come from context/props
  const [eventStatus, setEventStatus] = useState('active'); // 'active', 'ended', etc.

  // This would typically come from an API that monitors event status
  useEffect(() => {
    // Simulating an event API - in a real app, you would fetch this
    const checkEventStatus = async () => {
      // Mock implementation - replace with actual API call
      // const response = await axios.get(`http://localhost:5000/event-status/${eventId}`);
      // setEventStatus(response.data.status);
    };

    const intervalId = setInterval(checkEventStatus, 60000); // Check every minute

    // Example of handling an event ending (for demonstration purposes)
    // In a real app, you would respond to server events or API calls
    const simulateEventEnd = () => {
      // This is just for demo - remove in real implementation
      // Comment out or replace with actual event end detection
      const confirmEnd = window.confirm('Simulate event ending for testing?');
      if (confirmEnd) {
        setEventStatus('ended');
        alert('Event has ended. Leaving event room.');
      }
    };

    // Add event end button for testing
    const endButton = document.createElement('button');
    endButton.innerText = 'Simulate Event End';
    endButton.style.position = 'fixed';
    endButton.style.bottom = '10px';
    endButton.style.right = '10px';
    endButton.style.zIndex = '1000';
    endButton.style.padding = '8px';
    endButton.style.backgroundColor = '#ff4444';
    endButton.style.color = 'white';
    endButton.style.border = 'none';
    endButton.style.borderRadius = '4px';
    endButton.style.cursor = 'pointer';
    endButton.onclick = simulateEventEnd;
    document.body.appendChild(endButton);

    return () => {
      clearInterval(intervalId);
      // Remove test button on cleanup
      document.body.removeChild(endButton);
    };
  }, [eventId]);

  // Effect to handle event ending
  useEffect(() => {
    if (eventStatus === 'ended') {
      // When event ends, force navigation away from language pages
      if (currentPage === 'language' || currentPage === 'statistics') {
        setCurrentPage('chat');
      }
    }
  }, [eventStatus, currentPage]);

  const renderPage = () => {
    // Don't show language pages if event has ended
    if (eventStatus === 'ended' && (currentPage === 'language' || currentPage === 'statistics')) {
      return <div className="event-ended-message">
        This event has ended. Language preferences are no longer available.
      </div>;
    }

    switch (currentPage) {
      case 'chat':
        return <ChatSystem currentUser={currentUser} />;
      case 'language':
        return <LanguageSelector userId={currentUser._id} eventId={eventId} />;
      case 'statistics':
        return <LanguageStatistics role={currentUser.role} eventId={eventId} />;
      default:
        return <ChatSystem currentUser={currentUser} />;
    }
  };

  return (
    <div className="App">
      <nav className="app-nav">
        <button
          className={currentPage === 'chat' ? 'active' : ''}
          onClick={() => setCurrentPage('chat')}
        >
          Chat
        </button>
        <button
          className={currentPage === 'language' ? 'active' : ''}
          onClick={() => setCurrentPage('language')}
          disabled={eventStatus === 'ended'}
        >
          Language Preference
        </button>
        <button
          className={currentPage === 'statistics' ? 'active' : ''}
          onClick={() => setCurrentPage('statistics')}
          disabled={eventStatus === 'ended'}
        >
          Language Statistics
        </button>
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;