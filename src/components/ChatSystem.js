import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './ChatSystem.css';

// const socket = io('http://localhost:9000');

// const socket = io('http://localhost:5000', {
//   // reconnection: true,
//   // reconnectionAttempts: 5,
//   // reconnectionDelay: 1000,
//   transports: ['websocket']
// });

const socket = io('wss://qurious.ddns.net', {
  path: '/qurious-engagement/socket.io/',
  transports: ['websocket']
});

const ChatSystem = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const chatContainerRef = useRef(null);

  // Add this near the top where other useState declarations are
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);


  useEffect(() => {
    if (!currentUser) return;

    // Connect and setup listeners
    // socket.on('connect', () => console.log('Connected to WebSocket'));

    // Setup message listener
    // socket.on('receive_message', (message) => {
    //   console.log("message received:", message);
    //   setMessages(prevMessages => {
    //     const messageExists = prevMessages.some(m => m._id === message._id);
    //     if (!messageExists) {
    //       return [...prevMessages, message];
    //     }
    //     return prevMessages;
    //   });
    // });

    socket.on('receive_message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      // Auto-scroll to bottom when new message arrives
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });

    // New listener for latest message updates
    socket.on('latest_message_update', (data) => {
      // Check if this update is relevant to the current user
      if (data.user_id === currentUser._id || data.other_user_id === currentUser._id) {
        // Update the users list with the latest message
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            // Find the user this message belongs to
            if (user._id === data.user_id || user._id === data.other_user_id) {
              if (user._id !== currentUser._id) {
                return {
                  ...user,
                  latest_message: data.message
                };
              }
            }
            return user;
          }).sort((a, b) => {
            // Sort by latest message timestamp
            const timeA = a.latest_message?.timestamp || '';
            const timeB = b.latest_message?.timestamp || '';
            return timeB.localeCompare(timeA);
          });
        });
      }
    });

    socket.on('room_joined', (data) => {
      console.log('Joined room:', data.room);
    });

    // Fetch initial users
    fetchUsers();

    // Cleanup function
    return () => {
      if (currentRoom) {
        socket.emit('leave_room', { room: currentRoom });
      }
      socket.off('connect');
      socket.off('user_registered');
      socket.off('receive_message');
      socket.off('latest_message_update');
      socket.off('room_joined');
    };
  }, [currentUser]); // Empty dependency array for initial setup

  const fetchUsers = async () => {
    try {
      // const endpoint = currentUser.role === "admin"
      //   ? `http://localhost:5000/organizers?current_user_id=${currentUser._id}`
      //   : `http://localhost:5000/admins?current_user_id=${currentUser._id}`;

      const endpoint = currentUser.role === "admin"
        ? `https://qurious.ddns.net/qurious-engagement/api/organizers?current_user_id=${currentUser._id}`
        : `https://qurious.ddns.net/qurious-engagement/api/admins?current_user_id=${currentUser._id}`;

      const response = await axios.get(endpoint);

      // Sort by latest message timestamp
      const sortedUsers = response.data
        .filter(user => user._id !== currentUser._id)
        .sort((a, b) => {
          const timeA = a.latest_message?.timestamp || '';
          const timeB = b.latest_message?.timestamp || '';
          return timeB.localeCompare(timeA);
        });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      // Leave current room if exists
      if (currentRoom) {
        socket.emit('leave_room', { room: currentRoom });
      }

      setSelectedUser(user);

      const roomResponse = await axios.post(
        // `http://localhost:5000/chat-room/${currentUser._id}/${user._id}`
        `https://qurious.ddns.net/qurious-engagement/api/chat-room/${currentUser._id}/${user._id}`
      );
      const chatRoomId = roomResponse.data._id;

      // Join the new room
      socket.emit('join_room', { room: chatRoomId });
      setCurrentRoom(chatRoomId);

      // Fetch messages for this room
      const messagesResponse = await axios.get(
        // `http://localhost:5000/chat-room/${currentUser._id}/${user._id}`
        `https://qurious.ddns.net/qurious-engagement/api/chat-room/${currentUser._id}/${user._id}`
      );
      setMessages(messagesResponse.data.messages);

      // Auto-scroll to bottom when loading messages
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error setting up chat:', error);
    }
  };


  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser && currentRoom) {
      const messageData = {
        chat_room_id: currentRoom,
        sender_id: currentUser._id,
        content: newMessage.trim()
      };

      socket.emit('send_message', messageData, (response) => {
        if (response && response.error) {
          console.error('Error sending message:', response.error);
        } else {
          console.log('Message sent successfully:', response);
        }
      });

      setNewMessage('');
    }
  };


  // Add this search function with the other functions
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        // `http://localhost:5000/search-messages?current_user_id=${currentUser._id}&query=${encodeURIComponent(searchQuery)}`
        `https://qurious.ddns.net/qurious-engagement/api/search-messages?current_user_id=${currentUser._id}&query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add this function to navigate to a specific message
  const goToMessage = async (result) => {
    // Find the user in the users list
    const user = users.find(u => u._id === result.other_user_id);

    if (user) {
      // Select the user
      await handleUserSelect(user);

      // Close search results
      setShowSearchResults(false);

      // Add some delay to ensure messages are loaded
      setTimeout(() => {
        // Find the message element by its ID and scroll to it
        const messageElement = document.getElementById(`message-${result.message_id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth' });
          messageElement.classList.add('highlighted-message');
          setTimeout(() => {
            messageElement.classList.remove('highlighted-message');
          }, 3000);
        }
      }, 300);
    }
  };


  return (
    <div className="chat-system">
      <div className="users-list">

        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              <h3>Search Results</h3>
              <button onClick={() => setShowSearchResults(false)}>Close</button>
            </div>
            <div className="search-results-list">
              {searchResults.map(result => (
                <div
                  key={result.message_id}
                  className="search-result-item"
                  onClick={() => goToMessage(result)}
                >
                  <div className="result-user">{result.other_user_email}</div>
                  <div className="result-message">{result.content}</div>
                  <div className="result-time">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSearchResults && searchResults.length === 0 && (
          <div className="no-results">No messages found matching your search.</div>
        )}

        {currentUser.role === "admin" ? (<h2>Organizers</h2>) : (<h2>Chat Admins</h2>)}
        {users.map(user => (
          <div
            key={user._id}
            className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
            onClick={() => handleUserSelect(user)}
          >
            <div className="user-info">
              <div className="user-name">{user.email}</div>
              <div className="user-role">{user._id}</div>
              {user.latest_message && (
                <div className="latest-message">
                  <span className="message-preview">
                    {user.latest_message.content.length > 30
                      ? user.latest_message.content.substring(0, 30) + '...'
                      : user.latest_message.content}
                  </span>
                  <span className="message-time">
                    {new Date(user.latest_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>Chat with {selectedUser.email}</h3>
            </div>
            <div className="messages-container" ref={chatContainerRef}>
              {messages.map(message => (
                <div
                  key={message._id}
                  id={`message-${message._id}`}
                  className={`message ${message.sender_id === currentUser._id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <form className="message-input-form" onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem; 