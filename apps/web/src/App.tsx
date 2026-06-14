import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddReading from './pages/AddReading';
import Heatmap from './pages/Heatmap';
import Visualiser3D from './pages/Visualiser3D';
import Anchors from './pages/Anchors';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-icon">📡</span>
            <h1>WaveSight</h1>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" end>
              <span className="nav-icon">📊</span>
              Dashboard
            </NavLink>
            <NavLink to="/add-reading">
              <span className="nav-icon">➕</span>
              Add Reading
            </NavLink>
            <NavLink to="/heatmap">
              <span className="nav-icon">🗺️</span>
              2D Signal Field
            </NavLink>
            <NavLink to="/3d">
              <span className="nav-icon">📡</span>
              3D Signal Field
            </NavLink>
            <NavLink to="/anchors">
              <span className="nav-icon">⚓</span>
              Anchors
            </NavLink>
            <NavLink to="/about">
              <span className="nav-icon">ℹ️</span>
              About
            </NavLink>
          </nav>
          <div className="sidebar-footer">
            <p>WaveSight v0.1.0</p>
            <p>Wi-Fi Signal Mapper</p>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-reading" element={<AddReading />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/3d" element={<Visualiser3D />} />
            <Route path="/anchors" element={<Anchors />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
