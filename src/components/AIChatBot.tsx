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
      text: 'Hi there! I am your Bright Shopping Assistant. Looking for a certified refurbished smartphone? Ask me to recommend top models, compare specs, or check device details!'
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

    const lower = textToSend.toLowerCase();

    // Instant accurate answers for store policies
    if (lower.includes('warranty') || lower.includes('return') || lower.includes('replace') || lower.includes('refund')) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: 'At Bright, all smartphones are 100% pre-owned & certified refurbished. Each device passes rigorous multi-point hardware testing before dispatch. To keep prices at the best competitive rates, all sales are final — we do not offer returns, replacements, or manufacturer warranty.'
          }
        ]);
        setLoading(false);
      }, 400);
      return;
    }

    if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('tracking')) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: 'We provide express, carefully packed pan-India shipping. Orders are dispatched within 24–48 hours, and tracking details are updated in your Account > Purchases page.'
          }
        ]);
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/products/ai-chat', {
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
          { sender: 'assistant', text: 'You can explore our top refurbished smartphones under the Refurbished Phones tab, or connect with our support team on WhatsApp (+91 79079 24190) for instant assistance.' }
        ]);
      }
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Explore our catalog of certified refurbished smartphones, or reach our WhatsApp support (+91 79079 24190) for personalized deals!' }
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
    'Top phones under ₹20,000',
    'Compare iPhone & Samsung',
    'Quality & Testing policy?'
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
