import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { CalendarProvider } from "./components/Settings";
import "./index.css";

// Stagewise toolbar integration - only in development mode
if (import.meta.env.DEV) {
  const stagewiseConfig = {
    plugins: [],
  };

  import("@stagewise/toolbar-react").then(({ StagewiseToolbar }) => {
    // Create a separate root for the toolbar to avoid interfering with the main app
    const toolbarContainer = document.createElement("div");
    toolbarContainer.id = "stagewise-toolbar-root";
    document.body.appendChild(toolbarContainer);

    ReactDOM.createRoot(toolbarContainer).render(<StagewiseToolbar config={stagewiseConfig} />);
  });
}

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
