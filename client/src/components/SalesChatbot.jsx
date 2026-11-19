import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Trash2, Bot, User, Maximize2, Minimize2, Cpu } from 'lucide-react';
import { sendChatMessage } from '../api';

const STARTER_QUESTIONS = [
  'What is our #1 best-selling product by revenue?',
  'What was our total revenue and overall profit margin?',
  'Which product category is the most profitable?',
  'Are there any slow-moving products tying up cash on shelves?'
];

function formatMessageContent(text, isUser) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-1.5 space-y-1 pl-4 list-disc marker:text-[#FF901E]"
        >
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const renderFormattedSpans = rawStr => {
    // Regex for bold (**text**), inline code (`code`)
    const tokens = rawStr.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, tIdx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong
            key={tIdx}
            className={`font-semibold ${isUser ? 'text-white' : 'text-[#172033] dark:text-white'}`}
          >
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={tIdx}
            className={`px-1 py-0.5 rounded text-[11px] font-mono ${
              isUser
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-[#1E2538] text-[#FF901E] border border-slate-200 dark:border-[#27314C]'
            }`}
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Bullet points: *, -, •, or numbered like 1., 2.
    const bulletMatch = trimmed.match(/^([*\-•]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${idx}`} className="text-xs leading-relaxed">
          {renderFormattedSpans(bulletMatch[2])}
        </li>
      );
      return;
    }

    flushList();

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h4-${idx}`}
          className={`font-bold text-xs mt-2 mb-1 ${isUser ? 'text-white' : 'text-[#172033] dark:text-white'}`}
        >
          {renderFormattedSpans(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h3-${idx}`}
          className={`font-bold text-sm mt-2 mb-1 ${isUser ? 'text-white' : 'text-[#172033] dark:text-white'}`}
        >
          {renderFormattedSpans(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    elements.push(
      <p
        key={`p-${idx}`}
        className={`${elements.length > 0 ? 'mt-1.5' : ''} text-xs leading-relaxed`}
      >
        {renderFormattedSpans(line)}
      </p>
    );
  });

  flushList();
  return elements;
}

export default function SalesChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am your **SalesPulse AI Assistant** powered by **NVIDIA AI** (`nemotron-3.5-parse`).\n\nI answer questions strictly and exclusively using this store's real sales data. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async userText => {
    const textToSend = typeof userText === 'string' ? userText : input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build history for context (exclude welcome message)
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(userMessage.content, history);

      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'No response received from NVIDIA AI.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        configured: res.configured !== false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Error**: ${err.message || 'Unable to connect to the AI service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Chat history cleared. What would you like to know about your sales, revenue, products, or margins?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* 1. Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#FF901E] to-[#e07d15] text-white shadow-lg shadow-[#FF901E]/30 hover:shadow-xl hover:shadow-[#FF901E]/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          aria-label="Open SalesPulse AI Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-tight">Ask SalesPulse AI</span>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-md font-medium tracking-wide">
            NVIDIA NIM
          </span>
        </button>
      )}

      {/* 2. Interactive Chat Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-[#151927] border border-slate-200 dark:border-[#27314C] rounded-2xl shadow-2xl transition-all duration-200 overflow-hidden ${
            isExpanded
              ? 'w-[calc(100vw-2rem)] sm:w-[600px] h-[85vh] max-h-[700px]'
              : 'w-[calc(100vw-2rem)] sm:w-[410px] h-[550px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#151927] to-[#1E2538] text-white border-b border-[#27314C] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FF901E]/20 text-[#FF901E] border border-[#FF901E]/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xs font-bold text-white truncate">SalesPulse AI</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-[#8E9DB2]">
                  <Cpu className="w-2.5 h-2.5 text-[#FF901E]" />
                  <span className="truncate">NVIDIA nemotron-3.5-parse</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-1 shrink-0 text-[#8E9DB2]">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-[#0E131F]">
            {messages.map(m => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                      isUser
                        ? 'bg-[#FF901E] text-white shadow-xs'
                        : 'bg-[#151927] dark:bg-[#1E2538] text-[#FF901E] border border-[#27314C]'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3 h-3" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      isUser
                        ? 'bg-[#FF901E] text-white rounded-tr-xs'
                        : 'bg-white dark:bg-[#151927] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#27314C] rounded-tl-xs'
                    }`}
                  >
                    <div className="text-xs break-words">
                      {formatMessageContent(m.content, isUser)}
                    </div>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isUser ? 'text-white/75' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#151927] text-[#FF901E] border border-[#27314C] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 animate-spin" />
                </div>
                <div className="bg-white dark:bg-[#151927] border border-slate-200 dark:border-[#27314C] rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF901E] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#FF901E] animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#FF901E] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1.5 font-medium">
                      Querying sales dataset...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Questions Chips (Shown when only welcome message exists) */}
          {messages.length <= 1 && (
            <div className="px-3.5 py-2.5 bg-slate-100/70 dark:bg-[#121724] border-t border-slate-200 dark:border-[#1E2436] shrink-0">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-[#8E9DB2] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#FF901E]" />
                <span>Suggested Questions</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1B2236] border border-slate-200 dark:border-[#27314C] text-slate-700 dark:text-slate-300 hover:border-[#FF901E] hover:text-[#FF901E] transition-colors truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-[#151927] border-t border-slate-200 dark:border-[#1E2436] shrink-0 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about sales, profits, top products..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#27314C] bg-slate-50 dark:bg-[#1B2236] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF901E] focus:border-[#FF901E] transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-[#FF901E] hover:bg-[#e07d15] text-white shadow-sm shadow-[#FF901E]/30 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
