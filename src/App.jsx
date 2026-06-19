import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import { useStore } from "./lib/store.js";
import BottomNav from "./components/BottomNav.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import Allenamento from "./pages/Allenamento.jsx";
import Rank from "./pages/Rank.jsx";
import Alimentazione from "./pages/Alimentazione.jsx";
import Profilo from "./pages/Profilo.jsx";
import WorkoutSession from "./pages/WorkoutSession.jsx";

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

  return (
    <div className="app-shell">
      <div className="app-container">
        {!onboarded ? (
          <Onboarding />
        ) : (
          <HashRouter>
            <Routes>
              {/* full-screen session (no bottom nav) */}
              <Route path="/session/:id" element={<WorkoutSession />} />
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
