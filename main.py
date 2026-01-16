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

# UPDATED: Added image_data field
class PromptRequest(BaseModel):
    prompt: str
    existing_code: str = "" 
    image_data: str | None = None  # New field for the image string

@app.post("/generate")
async def generate_ui(request: PromptRequest):
    print(f"🤖 Processing instruction: {request.prompt}")
    
    # SYSTEM MESSAGE: Preserving your custom Navigation & Style rules
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
    
    # LOGIC SWITCH: Check if an image was uploaded
    if request.image_data:
        # --- VISION MODE (NEW 2026 STANDARD) ---
        print("👁️ Vision Mode Activated (Llama 4 Scout)")
        # This is the CORRECT model ID for vision
        model = "meta-llama/llama-4-scout-17b-16e-instruct" 
        
        # Multimodal message structure
        messages = [
            {"role": "system", "content": system_msg},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": f"Build a React component that looks exactly like this image. Instruction: {request.prompt}"
                    },
                    {
                        "type": "image_url", 
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{request.image_data}"
                        }
                    }
                ]
            }
        ]
        
    else:
        # --- TEXT MODE ---
        print("📝 Text Mode Activated")
        model = "llama-3.3-70b-versatile"
        
        if request.existing_code:
            user_content = (
                f"Existing Code to modify:\n{request.existing_code}\n\n"
                f"New Instruction: {request.prompt}"
            )
        else:
            user_content = f"Create a new React component for: {request.prompt}"
            
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_content}
        ]

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            # Vision model sometimes needs a bit more creativity (temperature) to interpret layouts
            temperature=0.2, 
            max_tokens=6000, 
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