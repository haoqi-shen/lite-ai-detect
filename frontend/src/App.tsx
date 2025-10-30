import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import SidebarLayout from './components/SidebarLayout';

export default function App() {
  return (
    <BrowserRouter>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<Upload/>} />
          <Route path="/upload" element={<Upload/>} />
          <Route path="/jobs" element={<Jobs/>} />
          <Route path="/jobs/:id" element={<JobDetail/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
        </Routes>
      </SidebarLayout>
    </BrowserRouter>
  );
}


