import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Form } from './components/form/Form';

ReactDOM.render(
  <React.StrictMode>
    <Form state={{data: {hello: "world"}}} />
  </React.StrictMode>,
  document.getElementById('root')
);

