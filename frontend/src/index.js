//index.js
import React from 'react';
import { createRoot } from 'react-dom/client'; //to attach a React app to an HTML page.
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);                            