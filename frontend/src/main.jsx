import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Analytics } from "@vercel/analytics/react";
import App from "./app/App.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "716866073371-50ja4kc6r43al6f4k0utd7m206kvjtiv.apps.googleusercontent.com"}>
    <App />
     <Analytics />
  </GoogleOAuthProvider>
);
