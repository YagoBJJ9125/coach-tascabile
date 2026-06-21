import { useEffect } from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { useStore } from "./lib/store.js";
import { reconcile } from "./lib/progression.js";
import BottomNav from "./components/BottomNav.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import Allenamento from "./pages/Allenamento.jsx";
import Rank from "./pages/Rank.jsx";
import Alimentazione from "./pages/Alimentazione.jsx";
import Profilo from "./pages/Profilo.jsx";
import WorkoutSession from "./pages/WorkoutSession.jsx";
import CoachChat from "./pages/CoachChat.jsx";

// Shell with bottom nav for tab pages.
function TabLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

export default function App() {
  const onboarded = useStore((s) => s.profile.onboarded);

  // apply progression decay + junk-food penalties once on load (and daily)
  useEffect(() => {
    if (onboarded) reconcile();
  }, [onboarded]);

  return (
    <div className="app-shell">
      <div className="app-container">
        {!onboarded ? (
          <Onboarding />
        ) : (
          <HashRouter>
            <Routes>
              {/* full-screen (no bottom nav) */}
              <Route path="/session/:id" element={<WorkoutSession />} />
              <Route path="/coach" element={<CoachChat />} />
              <Route element={<TabLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/allenamento" element={<Allenamento />} />
                <Route path="/rank" element={<Rank />} />
                <Route path="/alimentazione" element={<Alimentazione />} />
                <Route path="/profilo" element={<Profilo />} />
              </Route>
            </Routes>
          </HashRouter>
        )}
      </div>
    </div>
  );
}
