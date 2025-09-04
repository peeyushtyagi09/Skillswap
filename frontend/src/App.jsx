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
import Loader1 from '../components/Loaders/Loader1';
// Lenis
import LenisProvider from './LenisProvider';

const App = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // routes where Loader1 should NOT appear
  const noLoaderRoutes = ["/call", "/create-profile", "/update-profile", "/chat", "/"];

  const shouldUseLoader1 = !noLoaderRoutes.includes(location.pathname);

  const wrapWithLoader1 = (element) =>
    shouldUseLoader1 ? <Loader1>{element}</Loader1> : element;

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
              wrapWithLoader1(<Home />)
            )
          }
        />

        {/* Protected Routes */}
        <Route element={<Protect />}>
          <Route path="/landing" element={wrapWithLoader1(<Landing />)} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/working" element={wrapWithLoader1(<Working />)} />
          <Route path="/view-profile" element={wrapWithLoader1(<ViewProfilePage />)} />
          <Route
            path="/view-profile/:userId"
            element={wrapWithLoader1(<ViewProfilePage />)}
          />
        </Route>

        {/* Open Routes */}
        <Route path="/discuss" element={wrapWithLoader1(<Discuss />)} />
        <Route path="/friends" element={wrapWithLoader1(<Friends />)} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/call" element={<CallPage />} />
      </Routes>
    </LenisProvider>
  );
};

export default App;