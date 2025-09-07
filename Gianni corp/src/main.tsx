
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './styles/index.css';

import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServicesTable from './pages/ServicesTable';
import People from './pages/People';
import PeopleTable from './pages/PeopleTable';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Settings from './pages/Settings';

function AppError(){
  return (
    <div className="max-w-screen-sm mx-auto mt-16 empty">
      <div className="title">Unerwarteter Fehler</div>
      <div className="hint">Etwas ist schiefgelaufen. Wechsle zu einem Tab oder lade neu.</div>
    </div>
  );
}
function AppNotFound(){
  return (
    <div className="max-w-screen-sm mx-auto mt-16 empty">
      <div className="title">Seite nicht gefunden</div>
      <div className="hint">Nutze die Navigation unten/links.</div>
    </div>
  );
}

// Detect Capacitor native runtime to prefer hash routing inside WebView
const isNative = (typeof (window as any).Capacitor !== 'undefined') && (typeof (window as any).Capacitor.isNativePlatform === 'function') ? (window as any).Capacitor.isNativePlatform() : false;

const router = (isNative ? createHashRouter : createBrowserRouter)([
  { path: '/', element: <App/>, errorElement: <AppError/>, children: [
    { index: true, element: <Dashboard/> },
    { path: 'abos', element: <Services/> },
    { path: 'abos/tabelle', element: <ServicesTable/> },
    { path: 'personen', element: <People/> },
    { path: 'personen/tabelle', element: <PeopleTable/> },
    { path: 'finanzen', element: <Finance/> },
    { path: 'aufgaben', element: <Tasks/> },
    { path: 'projekte', element: <Projects/> },
    { path: 'settings', element: <Settings/> },
    { path: '*', element: <AppNotFound/> },
  ]}
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
