# Yaho-Sekai 🚀

Yaho-Sekai is a full-stack generative UI platform capable of "Vision-to-Code" synthesis. Powered by FastAPI and Llama 4 Vision (via Groq), it allows users to upload screenshots, sketches, or wireframes and instantly converts them into editable, production-ready React + Tailwind code with persistent history and live preview.

### 🌟 Live Demo
* **Frontend:** [Insert your Netlify URL here]
* **Backend:** Hosted on Render (FastAPI)

### 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS, Sandpack (for live code preview)
* **Backend:** Python, FastAPI, Uvicorn
* **AI Engine:** Groq API (Llama 4 Vision)

### 💻 Local Setup

**1. Clone the repository**
`bash
git clone https://github.com/Torpid-Quark/Yaho-Sekai.git
cd Yaho-Sekai
`

**2. Setup Backend (Python)**
`bash
# Install dependencies
pip install -r requirements.txt

# Create a config.env file and add your GROQ_API_KEY
echo "GROQ_API_KEY=your_api_key_here" > config.env

# Run the server
uvicorn main:app --reload --port 8000
`

**3. Setup Frontend (React)**
`bash
# Navigate to the frontend directory (if applicable) or root
npm install

# Start the React app
npm start
`

### ✨ Features
* **Vision-to-Code:** Upload UI images and let AI generate the structural code.
* **Text-to-Code:** Describe what you want, and watch it build.
* **Live Sandpack Preview:** Instantly view and interact with the generated React components.
* **Persistent History:** Your generated UI sessions are saved locally so you never lose your work.
