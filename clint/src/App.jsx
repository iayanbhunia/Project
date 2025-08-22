import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRegister from './pages/AdminRegister';
import Elections from './pages/Elections';
import ElectionDetails from './pages/ElectionDetails';
import ElectionResults from './pages/ElectionHistory';
import Profile from './pages/Profile';
import Leaders from './pages/Leaders';
import Results from './pages/Results';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-register" element={<AdminRegister />} />
            <Route path="/elections" element={<Elections />} />
            <Route path="/elections/:id" element={<ElectionDetails />} />
            <Route path="/results" element={<ElectionResults />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/leaders/:constituency" element={<Leaders />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
