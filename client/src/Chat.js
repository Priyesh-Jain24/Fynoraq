import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { marked } from 'marked';
import { FaDownload } from "react-icons/fa6";
import logo from './logo.jpg';
import main from './main.png';


function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const chatBoxRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages([...messages, { sender: "You", text: userMessage, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);

    try {
      // AFTER
      const res = await axios.post("https://fynoraq-server.onrender.com/api/chat", { message: userMessage });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { sender: "Fynoraq", text: reply, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: "Fynoraq", text: "Error: Could not get response. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  const copyMessage = async (text, index) => {
    try {
      const html = marked.parse(text);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const cleanText = tempDiv.innerText;
      await navigator.clipboard.writeText(cleanText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear all messages?")) {
      setMessages([]);
    }
  };

  const exportChat = () => {
    const chatText = messages.map(msg => {
      const html = marked.parse(msg.text);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const plainText = tempDiv.innerText || tempDiv.textContent;
      return `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.sender}: ${plainText}`;
    }).join('\n\n');

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Landing Page Component
  if (!showChat) {
    return (
      <div className="landing-container">
        <div className="landing-content">
          <div className="landing-logo">
            <img src={main} alt="Fynoraq AI" />
          </div>
          <h1 className="landing-title">Fynoraq AI Assistant</h1>
          <p className="landing-subtitle">Your intelligent conversation partner</p>
          <button className="get-started-button" onClick={() => setShowChat(true)}>
            Get Started
            <span className="arrow-icon">→</span>
          </button>
        </div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-title">
            <span className="ai-icon"> <img src={logo} alt="My Image" width={30} /></span>
            Fynoraq AI Assistant
          </div>
          <div className="header-actions">
            <button className="icon-button" onClick={exportChat} disabled={messages.length === 0} title="Export Chat">
              <FaDownload />
            </button>
            <button className="icon-button" onClick={clearChat} disabled={messages.length === 0} title="Clear Chat">
              🗑️
            </button>
          </div>
        </div>
      </div>
      
      <div className="chat-box" ref={chatBoxRef}>
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">👋</div>
            <h2>Welcome to Fynoraq AI Assistant!</h2>
            <p>I'm here to help you with any questions or concerns.</p>
            <div className="welcome-features">
              <div className="feature">💬 Natural conversations</div>
              <div className="feature">📋 Copy responses</div>
              <div className="feature">💾 Export chat history</div>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === "You" ? "user" : "bot"}`}>
            <div className="message-bubble">
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              
              <div className="message-text"> <ReactMarkdown>{msg.text}</ReactMarkdown></div>
              
            </div>
            <button 
                className="copy-button" 
                onClick={() => copyMessage(msg.text, i)}
                title="Copy message"
              >
                {copiedIndex === i ? '✓ Copied!' : '📋'}
              </button>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <div className="input-actions">
            <span className="char-count">{input.length}/500</span>
            <button 
              className="send-button" 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <span className="send-icon">➤</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
