import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
// Pages
import Landing from '../pages/Landing';
import Discuss from '../pages/Discuss';
import Friends from '../pages/friends';
import ChatPage from '../pages/Chat';
import CallPage from '../pages/Call';
import Working from '../pages/Working';
import CreateProfile from '../components/Landing/CreateProfile';
import UpdateProfile from '../components/Landing/UpdateProfile';
import ViewProfilePage from '../pages/ViewProfile';

// components
import Protect from '../components/protect/PrivateRoute';
import Loader from '../pages/Loader'; // 👈 add loader 
// Lenis
import LenisProvider from './LenisProvider';

const App = () => {
  const [loading, setLoading] = useState(true); 

  return (
    <LenisProvider>
      <Routes>
        {/* Loader before Home */}
        <Route
          path="/"
          element={
            loading ? (
              <Loader onFinish={() => setLoading(false)} />
            ) : (
              <Home />
            )
          }
        />

        {/* Protected Routes */}
        <Route element={<Protect />}>
          <Route path="/landing" element={<Landing />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/working" element={<Working />} />
          <Route path="/view-profile" element={<ViewProfilePage />} />
          <Route
            path="/view-profile/:userId"
            element={<ViewProfilePage />}
          />
        </Route>

        {/* Open Routes */}
        <Route path="/discuss" element={<Discuss />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/call" element={<CallPage />} />
      </Routes>
    </LenisProvider>
  );
};

export default App;