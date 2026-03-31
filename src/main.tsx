import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// App is inside the app folder
import App from './app/App'; 

// Styles is NOT in the app folder, it's right here in src!
import './styles/index.css'; 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);