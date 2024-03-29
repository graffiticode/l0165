import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { View } from "./view";

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>,
);
