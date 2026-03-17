import { createRoot } from "react-dom/client";
import { inject } from '@vercel/analytics';
import './i18n';
import App from "./App.tsx";
import "./index.css";

inject();

createRoot(document.getElementById("root")!).render(<App />);
