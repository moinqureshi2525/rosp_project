import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import { canteenAPI } from '../../services/api';

const AdminAIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your SmartCanteen AI assistant. I can analyze sales history, stock levels, and ML demand forecasts to help you optimize canteen operations. What would you like to know today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    'What should we prepare tomorrow?',
    'Which food items are most popular?',
    'Which items have low stock?',
    'Why might food wastage be high?',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (userMessage) => {
    const messageToSend = userMessage || input;
    if (!messageToSend.trim()) return;

    // Add user prompt to chat
    const updatedMessages = [...messages, { sender: 'user', text: messageToSend }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Call FastAPI backend AI chat endpoint (POST /api/ai/chat)
      const res = await canteenAPI.sendAIMessage(messageToSend);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.response || 'Analyzed canteen metrics successfully.',
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to get response from AI assistant.');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I am having trouble connecting to the backend AI service right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Title & Description Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
          <Sparkles size={14} /> Powered by Gemini API
        </div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
          SmartCanteen AI Assistant 🤖
        </h1>
        <p className="text-slate-500 text-sm">
          Ask questions about sales, inventory and food demand.
        </p>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={20} />}
              </div>

              <div
                className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-100/90 text-slate-800 rounded-tl-none border border-slate-200/60'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100 text-slate-600 text-sm flex items-center gap-2 font-medium">
                <Loader2 size={16} className="animate-spin text-brand-600" />
                <span>AI is analyzing canteen data...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
            <Lightbulb size={13} className="text-amber-500" /> Suggested Prompts
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleSend(prompt)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-all whitespace-nowrap shadow-2xs disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI anything about sales, demand, or stock..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3.5 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-brand-600 transition-all shadow-md disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAIAssistant;
