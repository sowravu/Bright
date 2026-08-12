'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import styles from './AIChatBot.module.css';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hi there! I am your Bright AI Shopping Assistant. Looking for a new Vivo or Lava smartphone? Ask me to recommend one, explain specs, or guide you through offers!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/products/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: 'Sorry, I encountered an issue processing that query. Please try again.' }
        ]);
      }
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Network connection issue. Please check if the backend server is running.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const suggestions = [
    'Best camera phone?',
    'Lava phone under ₹20,000',
    'Compare Vivo & Nothing',
    'Warranty and Returns?'
  ];

  return (
    <div className={styles.chatbotWrapper}>
      {/* Bubble button */}
      {!isOpen && (
        <button className={`${styles.bubbleBtn} animatePulse`} onClick={() => setIsOpen(true)}>
          <Sparkles size={24} />
          <span className={styles.tooltip}>AI Assistant</span>
        </button>
      )}

      {/* Chatbox Panel */}
      {isOpen && (
        <div className={`${styles.chatWindow} glass`}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <Sparkles size={18} className={styles.sparkleIcon} />
              <div>
                <h3>Bright Assistant</h3>
                <span>Online</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className={styles.chatMessages}>
            {messages.map((m, idx) => (
              <div key={idx} className={`${styles.msgRow} ${m.sender === 'user' ? styles.userRow : styles.assistantRow}`}>
                <div className={styles.msgBubble}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.msgRow} ${styles.assistantRow}`}>
                <div className={`${styles.msgBubble} ${styles.loadingBubble}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          {messages.length === 1 && (
            <div className={styles.suggestions}>
              {suggestions.map((s, idx) => (
                <button key={idx} className={styles.suggestionBtn} onClick={() => handleSuggestionClick(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className={styles.chatInputRow}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className={styles.sendBtn} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
