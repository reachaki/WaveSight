import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import Dashboard from './pages/Dashboard';
import AddReading from './pages/AddReading';
import Heatmap from './pages/Heatmap';
import Visualiser3D from './pages/Visualiser3D';
import Anchors from './pages/Anchors';
import About from './pages/About';
import './App.css';

export type DataMode = 'real' | 'demo';

interface DataModeContextType {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
}

const DataModeContext = createContext<DataModeContextType>({
  mode: 'real',
  setMode: () => {}
});

export const useDataMode = () => useContext(DataModeContext);

function App() {
  const [mode, setModeState] = useState<DataMode>(() => {
    const saved = localStorage.getItem('wavesight_data_mode');
    return (saved === 'real' || saved === 'demo') ? saved : 'real';
  });

  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    localStorage.setItem('wavesight_data_mode', newMode);
  };

  return (
    <DataModeContext.Provider value={{ mode, setMode }}>
      <BrowserRouter>
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-brand">
              <span className="brand-icon">📡</span>
              <h1>WaveSight</h1>
            </div>

            {/* Premium Data Mode Toggle */}
            <div style={{
              padding: '0 var(--space-lg) var(--space-md) var(--space-lg)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-sm)'
            }}>
              <label style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '8px'
              }}>
                Operating Mode
              </label>
              <div style={{
                display: 'flex',
                background: '#070a13',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  onClick={() => setMode('real')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: mode === 'real' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
                    color: mode === 'real' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    boxShadow: mode === 'real' ? '0 2px 8px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                >
                  🏠 Real
                </button>
                <button
                  onClick={() => setMode('demo')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: mode === 'demo' ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : 'transparent',
                    color: mode === 'demo' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    boxShadow: mode === 'demo' ? '0 2px 8px rgba(234, 179, 8, 0.3)' : 'none'
                  }}
                >
                  🔬 Demo
                </button>
              </div>
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
    </DataModeContext.Provider>
  );
}

export default App;
