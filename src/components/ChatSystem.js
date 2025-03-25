import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './ChatSystem.css';

// const socket = io('http://localhost:9000');

const socket = io('http://localhost:9000', {
  reconnection: true,
  // reconnectionAttempts: 5,
  // reconnectionDelay: 1000,
  transports: ['websocket']
});  

const ChatSystem = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentRoom, setCurrentRoom] = useState(null);

    useEffect(() => {
        // Connect and setup listeners
        // socket.on('connect', () => console.log('Connected to WebSocket'));
        
        // Setup message listener
        socket.on('receive_message', (message) => {
            console.log("message received:", message);
            setMessages(prevMessages => {
                const messageExists = prevMessages.some(m => m._id === message._id);
                if (!messageExists) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
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
            // socket.off('connect');
            socket.off('receive_message');
            socket.off('room_joined');
        };
    }, []); // Empty dependency array for initial setup

    const fetchUsers = async () => {
        try {
            const response = currentUser.role === "admin" 
          ? await axios.get("http://localhost:9000/organizers") 
          : await axios.get("http://localhost:9000/admins");
            
          setUsers(response.data.filter(user => user._id !== currentUser._id));
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
                `http://localhost:9000/chat-room/${currentUser._id}/${user._id}`
            );
            const chatRoomId = roomResponse.data._id;
            
            // Join the new room
            socket.emit('join_room', { room: chatRoomId });
            setCurrentRoom(chatRoomId);
            
            // Fetch messages for this room
            const messagesResponse = await axios.get(
                `http://localhost:9000/chat-room/${currentUser._id}/${user._id}`
            );
            setMessages(messagesResponse.data.messages);
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



    return (
        <div className="chat-system">
            <div className="users-list">
              {currentUser.role === "admin" ? (<h2>Organizers</h2>) : (<h2>Chat Admins</h2>)}
                {users.map(user => (
                    <div
                        key={user._id}
                        className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                        onClick={() => handleUserSelect(user)}
                    >
                        {user.email} <br />
                        {user._id}
                    </div>
                ))}
            </div>
            
            <div className="chat-area">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <h3>Chat with {selectedUser.email}</h3>
                        </div>
                        <div className="messages-container">
                            {messages.map(message => (
                                <div
                                    key={message._id}
                                    className={`message ${message.sender_id === currentUser._id ? 'sent' : 'received'}`}
                                >
                                    <div className="message-content">{message.content}</div>
                                    <div className="message-timestamp">
                                        {/* {new Date(message.timestamp).toLocaleTimeString()} */}
                                        {message.timestamp}
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