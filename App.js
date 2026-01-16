import React, { useState, useEffect } from 'react';
import { Sandpack } from "@codesandbox/sandpack-react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 1. PERSISTENCE: Keeps your history array in LocalStorage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ai_ui_history");
    return saved ? JSON.parse(saved) : [];
  });

  // 2. FIXED INITIAL STATE: Always start fresh on a new session/refresh
  // Your sidebar will still have all your old work!
  const [code, setCode] = useState("import React from 'react';\n\nexport default function App() { return <div className='p-10 text-center text-gray-500'>New Session Started. Describe a UI to begin...</div> }");

  // 3. AUTO-SAVE: Whenever history changes, update LocalStorage
  useEffect(() => {
    localStorage.setItem("ai_ui_history", JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt,
          existing_code: code 
        }),
      });
      const data = await response.json();
      
      if (data.code) {
        setCode(data.code);
        setHistory(prev => [{ prompt: prompt, code: data.code, timestamp: new Date().getTime() }, ...prev]);
        setPrompt(""); 
      }
    } catch (error) {
      alert("Error: Is your Python server running?");
    }
    setLoading(false);
  };

  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "GeneratedUI.jsx";
    document.body.appendChild(element);
    element.click();
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to delete all saved designs?")) {
      setHistory([]);
      localStorage.removeItem("ai_ui_history");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-white border-r flex flex-col shadow-sm">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-700">History</h2>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-[10px] text-red-500 hover:underline uppercase font-bold">Clear All</button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400 italic">No saved designs yet.</p>
            </div>
          )}
          {history.map((item, index) => (
            <button 
              key={item.timestamp || index}
              onClick={() => setCode(item.code)}
              className={`w-full text-left text-xs p-3 rounded-lg border transition-all ${
                code === item.code 
                ? "bg-blue-50 border-blue-300 shadow-sm" 
                : "bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50"
              }`}
            >
              <div className="font-semibold text-gray-700 truncate">{item.prompt}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight italic">
            AI UI AUTOMATOR <span className="text-blue-600">PRO</span>
          </h1>
          <button 
            onClick={downloadCode}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md active:scale-95"
          >
            💾 EXPORT JSX
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
          <input 
            className="flex-1 p-3 outline-none text-sm text-gray-700 bg-transparent"
            placeholder="Edit current design or create new (e.g. 'Add a dark theme')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-sm disabled:bg-gray-300 transition-all shadow-md active:scale-95"
          >
            {loading ? "🚀 PROCESSING..." : "EXECUTE"}
          </button>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl border border-gray-300 bg-white">
          <Sandpack 
            template="react" 
            files={{ "/App.js": code }}
            options={{
              externalResources: ["https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"]
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;