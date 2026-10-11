import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { Provider } from './state.jsx';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* respeita a opção "reduzir movimento" do celular */}
    <MotionConfig reducedMotion="user">
      <Provider>
        <App />
      </Provider>
    </MotionConfig>
  </StrictMode>,
);
