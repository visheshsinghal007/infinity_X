import {createRoot} from 'react-dom/client';
import Workspace from './app/workspace';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<Workspace/>);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
