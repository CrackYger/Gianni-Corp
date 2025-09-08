import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './styles/index.css';
import './styles/_theme.css';
import ErrorBoundary from './app/ErrorBoundary';

const Dashboard = lazy(()=> import('./pages/Dashboard'));
const Services = lazy(()=> import('./pages/Services'));
const ServicesTable = lazy(()=> import('./pages/ServicesTable'));
const ServiceDetail = lazy(()=> import('./pages/ServiceDetail'));
const People = lazy(()=> import('./pages/People'));
const PeopleTable = lazy(()=> import('./pages/PeopleTable'));
const Finance = lazy(()=> import('./pages/Finance'));
const Tasks = lazy(()=> import('./pages/Tasks'));
const Projects = lazy(()=> import('./pages/Projects'));
const Settings = lazy(()=> import('./pages/Settings'));

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

// Detect native (Capacitor) and use hash
const router = (Capacitor?.isNativePlatform? createHashRouter: createBrowserRouter)([
  {
    path: '/',
    element: <App />,
    errorElement: <AppError/>,
    children: [
      { index: true, element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Dashboard/></Suspense> },
      { path: 'abos', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Services/></Suspense> },
      { path: 'abos/:id', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><ServiceDetail/></Suspense> },
      { path: 'abos/tabelle', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><ServicesTable/></Suspense> },
      { path: 'personen', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><People/></Suspense> },
      { path: 'personen/tabelle', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><PeopleTable/></Suspense> },
      { path: 'finanzen', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Finance/></Suspense> },
      { path: 'aufgaben', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Tasks/></Suspense> },
      { path: 'projekte', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Projects/></Suspense> },
      { path: 'settings', element: <Suspense fallback={<div className='card m-4 p-6'>Lädt…</div>}><Settings/></Suspense> },
      { path: '*', element: <AppNotFound/> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);

// Signal splash overlay removal once the app mounts
try { window.dispatchEvent(new Event('app:ready')); } catch {}

if (typeof window !== 'undefined'){
  window.addEventListener('error', (e)=>{
    console.error('Global error:', e.error || (e as any).message);
  });
  window.addEventListener('unhandledrejection', (e:any)=>{
    console.error('Unhandled rejection:', e.reason);
  });
}
