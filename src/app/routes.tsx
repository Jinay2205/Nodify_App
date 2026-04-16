import { createBrowserRouter } from "react-router";
import { Auth } from "./screens/Auth"; 
import { Onboarding } from "./screens/onboarding";
import { Dashboard } from "./screens/dashboard";
import { ConnectionDetail } from "./screens/connection-detail";
import { AddConnect } from "./screens/AddConnect"; 
import { Subnodes } from "./screens/Subnodes";
import { MyNodes } from "./screens/MyNodes"; 
import { ProtectedRoute } from "./components/ProtectedRoute"; 
import { Profile } from "./screens/Profile";
import { Inbox } from "./screens/Inbox";
import { GrowPage } from "./screens/GrowPage"; // ✨ Import the new screen

export const router = createBrowserRouter([
  // 🔓 PUBLIC ROUTES
  { path: "/", element: <Auth /> },                 
  { path: "/onboarding", element: <Onboarding /> }, 

  // 🔒 PROTECTED ROUTES
  { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },   
  { path: "/connection/:id", element: <ProtectedRoute><ConnectionDetail /></ProtectedRoute> },
  { path: "/add", element: <ProtectedRoute><AddConnect /></ProtectedRoute> },
  { path: "/subnodes", element: <ProtectedRoute><Subnodes /></ProtectedRoute> }, 
  { path: "/mynodes", element: <ProtectedRoute><MyNodes /></ProtectedRoute> }, 
  { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: "/inbox", element: <ProtectedRoute><Inbox /></ProtectedRoute> },
  { path: "/grow", element: <ProtectedRoute><GrowPage /></ProtectedRoute> }, // ✨ Add the Protected Route
]);