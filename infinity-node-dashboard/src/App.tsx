import {
  Activity,
  Bell,
  Cloud,
  Cpu,
  KeyRound,
  LayoutDashboard,
  Logs,
  Search,
  Settings,
  SquareTerminal,
  TableProperties,
  UserRound,
  Workflow,
} from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useMockRealtime } from './hooks/useMockRealtime'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { FunctionsPage } from './pages/FunctionsPage'
import { JobsPage } from './pages/JobsPage'
import { LogsPage } from './pages/LogsPage'
import { OverviewPage } from './pages/OverviewPage'

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/jobs', label: 'Jobs', icon: TableProperties },
  { to: '/logs', label: 'Logs', icon: Logs },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/functions', label: 'Functions', icon: Cloud },
]

const CONFIG_ITEMS = [
  { to: '#', label: 'Settings', icon: Settings },
  { to: '#', label: 'API Keys', icon: KeyRound },
  { to: '#', label: 'Alerts', icon: Bell },
]

function App() {
  const { metrics, jobs, logs, connectionState, functionCards, clusterHealth, timelineLanes } =
    useMockRealtime()
  const runningCount = jobs.filter((job) => job.status === 'running').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <SquareTerminal size={20} />
          <span>Infinity Node</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                to={item.to}
                key={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.label === 'Jobs' && runningCount > 0 && (
                  <span className="running-count">{runningCount}</span>
                )}
              </NavLink>
            )
          })}

          <p className="sidebar-group">COMPUTE</p>
          <span className="sidebar-item muted-item">
            <Cpu size={16} />
            <span>Containers</span>
          </span>
          <span className="sidebar-item muted-item">
            <Workflow size={16} />
            <span>Regions</span>
          </span>

          <p className="sidebar-group">CONFIG</p>
          {CONFIG_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <span className="sidebar-item muted-item" key={item.label}>
                <Icon size={16} />
                <span>{item.label}</span>
              </span>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-item muted-item">
            <SquareTerminal size={16} />
            <span>Sandbox</span>
          </span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <div className="project-pill">
              <span className="triangle">▲</span>
              <span>systems / production</span>
            </div>
            <div className="env-pill">
              <span className="env-dot" />
              us-east-1
            </div>
          </div>

          <div className="topbar-right">
            <label className="search-box" htmlFor="global-search">
              <Search size={14} />
              <input id="global-search" placeholder="Search jobs, nodes, functions" />
            </label>
            <span className={`conn-pill conn-${connectionState}`}>{connectionState.toUpperCase()}</span>
            <button type="button" className="icon-btn" aria-label="Notifications">
              <Bell size={15} />
            </button>
            <button type="button" className="avatar-btn" aria-label="Profile">
              <UserRound size={15} />
            </button>
          </div>
        </header>

        <main className="content-wrap">
          <Routes>
            <Route
              path="/overview"
              element={
                <OverviewPage
                  metrics={metrics}
                  timelineLanes={timelineLanes}
                  jobs={jobs}
                  clusterHealth={clusterHealth}
                />
              }
            />
            <Route path="/jobs" element={<JobsPage jobs={jobs} logs={logs} />} />
            <Route
              path="/logs"
              element={<LogsPage logs={logs} connectionState={connectionState} />}
            />
            <Route
              path="/functions"
              element={<FunctionsPage functionCards={functionCards} />}
            />
            <Route
              path="/analytics"
              element={<AnalyticsPage jobs={jobs} functionCards={functionCards} />}
            />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
