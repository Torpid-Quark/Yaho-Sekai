from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os

app = FastAPI()

# Enable CORS so your React app (Port 3000) can talk to this server (Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_key():
    """Loads the API key from your config file."""
    try:
        with open("config.env", "r") as f:
            for line in f:
                if "GROQ_API_KEY" in line:
                    return line.split("=")[1].strip()
    except Exception as e:
        print(f"Error loading key: {e}")
        return None

client = Groq(api_key=load_key())

# UPDATED: Added existing_code field
class PromptRequest(BaseModel):
    prompt: str
    existing_code: str = "" # Default to empty if it's the first prompt

@app.post("/generate")
async def generate_ui(request: PromptRequest):
    print(f"🤖 Processing instruction: {request.prompt}")
    
    # SYSTEM MESSAGE: Now includes instructions for editing/iterating
    system_msg = (
        "You are an expert React + Tailwind CSS developer. "
        "Output ONLY raw code. NO markdown backticks. "
        "NAVIGATION RULE: Do not use 'react-router-dom' or <Link> tags. "
        "To handle multiple pages, use a 'view' state (e.g., const [view, setView] = useState('home')). "
        "Use conditional rendering to show different components based on the 'view' state. "
        "Example: {view === 'home' ? <Home /> : <Details />}. "
        "CONTRAST RULE: Ensure high readability (dark bg = white text). "
        "FIXED IMAGE RULE: Use https://loremflickr.com/800/600/{KEYWORD}?lock=1 "
        "ICON RULE: Use emojis only (🚀, 🛒)."
    )
    
    # USER CONTENT: Combines the current code with the new instruction
    if request.existing_code:
        user_content = (
            f"Existing Code to modify:\n{request.existing_code}\n\n"
            f"New Instruction: {request.prompt}"
        )
    else:
        user_content = f"Create a new React component for: {request.prompt}"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_content}
            ],
        )
        
        content = response.choices[0].message.content
        
        # CLEANING: Strips backticks if the AI accidentally adds them
        clean_content = content.replace("```jsx", "").replace("```javascript", "").replace("```", "").strip()
        
        return {"code": clean_content}
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)