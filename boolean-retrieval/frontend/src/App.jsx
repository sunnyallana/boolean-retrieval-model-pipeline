import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavbarComponent from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './components/Home';
import DocumentSearchSystem from './components/DocumentSearchSystem';

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <NavbarComponent />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<DocumentSearchSystem />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;