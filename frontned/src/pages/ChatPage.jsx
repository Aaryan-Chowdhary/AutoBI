import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useDatasets } from '../context/DatasetContext';
import { api } from '../lib/api';

function ChatPage() {
  const { datasets } = useDatasets();
  const [selectedDataset, setSelectedDataset] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select first cleaned dataset
  useEffect(() => {
    if (datasets.length > 0 && !selectedDataset) {
      const cleaned = datasets.find(d => d.name?.startsWith('cleaned_'));
      if (cleaned) setSelectedDataset(cleaned.name);
      else setSelectedDataset(datasets[0].name);
    }
  }, [datasets]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedDataset || isLoading) return;

    const userMessage = { role: 'user', content: inputText.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: selectedDataset,
          question: userMessage.content
        })
      });

      const aiMessage = {
        role: 'assistant',
        content: res.answer || 'I could not generate an answer for that question.',
        timestamp: new Date(),
        context: res.context
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle="Chat with Data" />

        <main className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Dataset Selector Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                  <span className="material-symbols-outlined text-white text-lg">psychology</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">RAG Insights Hub</h2>
                  <p className="text-[11px] text-gray-400">Powered by Gemini AI</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="material-symbols-outlined text-blue-500 text-lg">database</span>
                  <select
                    value={selectedDataset}
                    onChange={(e) => {
                      setSelectedDataset(e.target.value);
                      setMessages([]);
                    }}
                    className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-6 max-w-[220px] truncate"
                  >
                    <option value="">Select a dataset...</option>
                    {datasets.map(ds => (
                      <option key={ds.id} value={ds.name}>{ds.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleClearChat}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                  title="Clear chat"
                >
                  <span className="material-symbols-outlined text-lg">delete_sweep</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center h-full">
                  <div className="text-center max-w-lg mx-auto py-20">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl text-violet-400">forum</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Chat with your Data</h3>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                      Select a dataset and ask questions in natural language.<br />
                      The AI will analyze your data and provide insights.
                    </p>
                    
                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        'What are the key trends in this data?',
                        'Show me a summary of all numeric columns',
                        'What are the top 5 categories?',
                        'Are there any outliers?'
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectedDataset) {
                              setInputText(suggestion);
                              inputRef.current?.focus();
                            }
                          }}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all hover:shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                        : msg.isError
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-white border border-gray-100 text-gray-700'
                    }`}
                  >
                    {msg.role === 'assistant' && !msg.isError && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
                        </div>
                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">AutoBI Insights</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.context && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-medium">
                          📊 {msg.context.totalRecords} rows · {msg.context.columnsUsed} columns analyzed
                        </span>
                      </div>
                    )}
                    <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-300'}`}>
                      {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[12px] animate-spin">progress_activity</span>
                      </div>
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Analyzing...</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 px-6 py-4 shrink-0">
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedDataset ? `Ask anything about ${selectedDataset}...` : 'Select a dataset first...'}
                    disabled={!selectedDataset || isLoading}
                    rows={1}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    onInput={(e) => {
                      e.target.style.height = '48px';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || !selectedDataset || isLoading}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-200/50 hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                AI may produce inaccurate results. Always verify important insights.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
