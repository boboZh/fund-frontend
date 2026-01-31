import React from 'react';
import { BrowserRouter, Routes, Route }  from 'react-router-dom';
import PermissionGuard from '@/router/PermissionGuard';
import {routes} from '@/router/config'
 
function App() {
  return (
    // basename必须和vite.config中的base一直
    <BrowserRouter basename='/'>
      <Routes>
        {
          routes.map((route) => (
            <Route key={route.path} path={route.path} element={
              <PermissionGuard auth={route.auth}>
                {route.element}
              </PermissionGuard>
            } />
          ))
        }
      </Routes>
    </BrowserRouter>    
  );
}

export default App;