import React from 'react';
import ChatSystem from './components/ChatSystem';

function App() {
    // Mock current user - in real app, this would come from authentication
    const [currentUser, setCurrentUser] = React.useState({
      _id: prompt("Enter your ID:") || "67b4295653f1cc90f6735289",
      // _id:"67e01d74b5db50c2b701e13a",
      role: prompt("Enter your role:") || "admin"
      // role: "organizer"
    });

    return (
        <div className="App">
            <ChatSystem currentUser={currentUser} />
        </div>
    );
}

export default App; 