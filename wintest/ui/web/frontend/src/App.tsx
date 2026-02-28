import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { TaskEditor } from './pages/TaskEditor';
import { ExecutionViewer } from './pages/ExecutionViewer';
import { ReportList } from './pages/ReportList';
import { ReportViewer } from './pages/ReportViewer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks/new" element={<TaskEditor />} />
          <Route path="/tasks/:filename/edit" element={<TaskEditor />} />
          <Route path="/execution" element={<ExecutionViewer />} />
          <Route path="/reports" element={<ReportList />} />
          <Route path="/reports/:reportId" element={<ReportViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
