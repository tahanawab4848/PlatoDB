import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ChatWizard from "./pages/ChatWizard";
import DbDesignerPage from "./pages/DbDesigner";
import Dashboard from "./pages/Dashboard";
import InfrastructurePage from "./pages/Infrastructure";
import AppLayout from "./components/layout/AppLayout";
import CursorTrail from "./components/ui/CursorTrail";
import StaticBackgroundIcons from "./components/ui/StaticBackgroundIcons";
import CommandPalette from "./components/ui/CommandPalette";
import AuthPage from "./pages/AuthPage";
import LearningLab from "./pages/LearningLab";
import { useStore } from "./store/useStore";

function App() {
  const { currentUser } = useStore();
  const location = useLocation();

  return (
    <>
      <StaticBackgroundIcons />
      <CommandPalette />
      {location.pathname !== "/app/designer" && <CursorTrail />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={currentUser ? <Navigate to="/app/dashboard" replace /> : <AuthPage />} />
        <Route path="/setup" element={currentUser ? <Navigate to="/app/setup" replace /> : <Navigate to="/auth" replace />} />
        
        <Route path="/app" element={currentUser ? <AppLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="setup" element={<ChatWizard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="designer" element={<DbDesignerPage />} />
          <Route path="learning-lab" element={<LearningLab />} />
          <Route path="infrastructure" element={<InfrastructurePage />} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
