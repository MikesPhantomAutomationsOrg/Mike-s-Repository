import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Startseite from "./Startseite";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Startseite />
  </StrictMode>
);
