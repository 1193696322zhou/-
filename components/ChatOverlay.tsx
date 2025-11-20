import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';

interface Props {
  contextAvailable: boolean;
}

export const ChatOverlay: React.FC<Props> = ({ contextAvailable }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Greetings. I have analyzed the paper. Do you have specific questions about the methodology or data?', timestamp: Date.now() }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Convert simple ChatMessage to history format for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await generateChatResponse(history, userMsg.text, null);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to assistant.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!contextAvailable) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-accent hover:bg-accent-dark text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center gap-2 animate-fade-in"
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-medium pr-1">Ask AI</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 bg-white shadow-2xl rounded-2xl border border-academic-200 z-50 flex flex-col transition-all duration-300 ${isExpanded ? 'w-[500px] h-[80vh]' : 'w-[380px] h-[500px]'}`}>
      
      {/* Chat Header */}
      <div className="p-4 border-b border-academic-100 flex items-center justify-between bg-academic-50 rounded-t-2xl">
        <div className="flex items-center gap-2 text-academic-800 font-bold">
          <Sparkles className="w-5 h-5 text-accent" />
          Scholar Chat
        </div>
        <div className="flex items-center gap-2 text-academic-500">
           <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-academic-800 p-1">
             {isExpanded ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
           </button>
           <button onClick={() => setIsOpen(false)} className="hover:text-academic-800 p-1">
             <X className="w-5 h-5"/>
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-academic-50/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-accent text-white rounded-br-none' 
                : 'bg-white border border-academic-200 text-academic-800 rounded-bl-none shadow-sm'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-academic-200 p-4 rounded-2xl rounded-bl-none shadow-sm">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-academic-400 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-academic-100 bg-white rounded-b-2xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about findings, methods..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-academic-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-academic-100 text-academic-600 rounded-lg hover:bg-accent hover:text-white disabled:opacity-50 disabled:hover:bg-academic-100 disabled:hover:text-academic-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};