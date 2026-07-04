# PlatoDB (formerly FlowForge)

> **The Premium, AI-Driven Visual Database Designer & CS Learning Lab.**

PlatoDB (developed initially as FlowForge) is a world-class, premium SaaS database designer and educational utility platform. It blends a high-end, Linear-inspired "Void" UI with a powerful 12-agent AI orchestration engine to provide an unparalleled developer and learning experience.

Whether you are a seasoned architect designing robust database schemas or a student learning database normalization, PlatoDB acts as your intelligent AI CTO and interactive visual workspace.

## 🚀 Key Features

### 🎨 Elite "Void" UI & Workspace
- **High-End Aesthetics:** Features a stunning "Void" UI with glassmorphism, subtle noise textures, deep dark-mode gradients, and ambient glow effects.
- **Professional IDE Layout:** Dedicated Left Sidebar for schema management, a central transparent React Flow canvas, and a robust Right-Pane Inspector for granular field editing.
- **Micro-interactions:** Smooth animations powered by Framer Motion to elevate the user experience.

### 🧠 Intelligent AI Co-Pilot & CTO Watchdog
- **12-Agent Orchestration:** A complex backend AI architecture that generates complete, multi-table schemas.
- **Contextual ChatWizard:** An AI-driven "Cursor-like" interaction flow featuring actionable option chips.
- **Real-Time Pedagogical Feedback:** The AI acts as a "Professor," offering context-aware architectural tutoring directly tied to your specific canvas design.

### 📐 Visual Database Designer
- **Interactive Canvas:** Built on `@xyflow/react` for a seamless drag-and-drop table and relationship management experience.
- **Real-Time Synchronization:** Instant state syncing between the visual diagram and the inspector sidebar.
- **Schema Mutations:** Granular control over table/column management with explicit apply-on-demand functionality.

### 📤 Universal Export Engine
- **Agnostic Output:** Automatically parse visual schemas into multiple formats: Mongoose (MERN), Prisma, SQL DDL, Django models, and Laravel migrations.
- **Zero-Mock Policy:** Generates realistic, production-ready seed data instead of generic placeholders.
- **Documentation Ready:** One-click generation and download of professional PDF architectural documents via `jspdf` and `html2canvas`.

### 🎓 CS Learning Lab
- **EdTech Experience:** A dedicated learning lab accessible via the global sidebar.
- **Interactive Modules:** Learn database normalization, indexing, and architectural best practices with real-time feedback from the conversational AI Professor.

## 🛠️ Tech Stack

**Frontend:**
- **React 19 & Vite:** Blazing fast development environment and optimized builds.
- **Tailwind CSS v4:** Utility-first styling with custom typography and design tokens.
- **Framer Motion:** High-fidelity micro-interactions and page transitions.
- **React Flow:** Advanced node-based visual diagramming.
- **Lucide React:** Beautiful, consistent iconography.

**Backend & Integration:**
- **Node.js & Express:** Lightweight, high-performance server.
- **Mongoose / MongoDB:** Native NoSQL schema support.
- **Socket.IO:** Real-time bidirectional event-based communication.
- **Groq SDK:** Extremely fast LLM inference powering the 12-agent AI orchestration.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm, yarn, or pnpm
- Groq API Key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/platodb.git
   cd platodb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   # Add other required environment variables
   ```

4. **Run the Development Servers**
   
   Start the frontend (Vite):
   ```bash
   npm run dev
   ```
   
   Start the backend (Express/Socket.io):
   ```bash
   npm run server
   ```

5. **Open the Application**
   Navigate to `http://localhost:5173` (or the port specified by Vite) in your browser.

## 📁 Project Structure

```text
platodb/
├── src/
│   ├── components/
│   │   ├── db-designer/      # Visual canvas, AI CTO, Inspector
│   │   └── ui/               # Reusable UI components (Command Palette, etc.)
│   ├── store/                # Global state management (Zustand/Context)
│   ├── index.css             # Global styles, Tailwind directives, Void UI theme
│   └── App.tsx               # Main application entry and routing
├── server/
│   └── index.js              # Express backend and Socket.io setup
├── public/                   # Static assets
└── package.json              # Project dependencies and scripts
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
