import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddReading from './pages/AddReading';
import Heatmap from './pages/Heatmap';
import Visualiser3D from './pages/Visualiser3D';
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
              2D Heatmap
            </NavLink>
            <NavLink to="/3d">
              <span className="nav-icon">🏠</span>
              3D Visualiser
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
            <Route path="/about" element={<Placeholder title="About" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      <p>Coming soon...</p>
    </div>
  );
}

export default App;
