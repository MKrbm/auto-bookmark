import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import '../app/features/styles/highlight.css';
import '../global.css';


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="bg-green-500 w-[400px] h-[500px] p-5">
      <Popup />
    </div>
  </StrictMode>
);
