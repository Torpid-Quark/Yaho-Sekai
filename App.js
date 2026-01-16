import React, { useState, useEffect } from 'react';
import { Sandpack } from "@codesandbox/sandpack-react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  
  // NEW: State for the uploaded image
  const [selectedImage, setSelectedImage] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);

  // 1. PERSISTENCE
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ai_ui_history");
    return saved ? JSON.parse(saved) : [];
  });

  // 2. INITIAL STATE
  const [code, setCode] = useState("import React from 'react';\n\nexport default function App() { return <div className='p-10 text-center text-gray-500'>New Session Started. Upload a screenshot or describe a UI...</div> }");

  // 3. AUTO-SAVE
  useEffect(() => {
    localStorage.setItem("ai_ui_history", JSON.stringify(history));
  }, [history]);

  // --- NEW: HANDLE IMAGE UPLOAD ---
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create a fake URL to show the user a preview
      setPreviewUrl(URL.createObjectURL(file));

      // Convert the file to Base64 text for the AI
      const reader = new FileReader();
      reader.onloadend = () => {
        // We only want the base64 string, not the "data:image/jpeg..." part
        const base64String = reader.result.split(',')[1];
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedImage) return; // Allow prompt OR image
    setLoading(true);
    
    try {
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt,
          existing_code: code,
          image_data: selectedImage // Sending the image data!
        }),
      });
      const data = await response.json();
      
      if (data.code) {
        setCode(data.code);
        setHistory(prev => [{ prompt: prompt || "Image Upload", code: data.code, timestamp: new Date().getTime() }, ...prev]);
        setPrompt(""); 
        clearImage(); // Clear image after sending
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
    if (window.confirm("Delete all history?")) {
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
            YAHO <span className="text-blue-600">SEKAI</span>
          </h1>
          <button 
            onClick={downloadCode}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md active:scale-95"
          >
            💾 EXPORT JSX
          </button>
        </div>

        {/* --- INPUT AREA --- */}
        <div className="mb-6 flex flex-col gap-2">
          
          {/* Image Preview Badge */}
          {previewUrl && (
            <div className="flex items-center gap-2 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-200">
              <img src={previewUrl} alt="Preview" className="w-6 h-6 rounded object-cover" />
              <span className="text-xs text-blue-600 font-bold">Image attached</span>
              <button onClick={clearImage} className="text-blue-400 hover:text-red-500 ml-2">✖</button>
            </div>
          )}

          <div className="flex gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200 items-center">
            
            {/* UPLOAD BUTTON */}
            <label className="cursor-pointer p-3 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
              📷
            </label>

            <input 
              className="flex-1 p-3 outline-none text-sm text-gray-700 bg-transparent"
              placeholder={previewUrl ? "Describe what to do with this image..." : "Describe a UI or upload a screenshot..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
            
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? "PROCESSING..." : "EXECUTE"}
            </button>
          </div>
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