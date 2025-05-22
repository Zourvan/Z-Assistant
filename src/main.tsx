import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { CalendarProvider } from "./components/Settings";
import "./index.css";

// Render the app with providers
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CalendarProvider>
        <App />
      </CalendarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
