console.log('Starting app initialization...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
console.log('CSS imported');

import App from './App';
console.log('App component imported');

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure your HTML has a <div id="root"></div> element.');
}

console.log('Root element found');

const root = ReactDOM.createRoot(rootElement);
console.log('React root created');

try {
  console.log('Attempting to render App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  root.render(
    <div style={{ padding: '20px', fontFamily: 'Arial', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Error Loading App</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>{error.message}</p>
      <pre style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', overflow: 'auto', maxWidth: '800px' }}>{error.stack}</pre>
      <button 
        onClick={() => window.location.reload()} 
        style={{ marginTop: '16px', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Reload Page
      </button>
    </div>
  );
}

