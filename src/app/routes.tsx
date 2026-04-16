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
import { GrowPage } from "./screens/GrowPage";

export const router = createBrowserRouter([
  // 🔓 PUBLIC ROUTE (Anyone can see the login screen)
  { path: "/", element: <Auth /> },                 

  // 🔒 THE PROTECTED ZONE (The Traffic Cop guards all of these)
  {
    element: <ProtectedRoute />, // This wraps EVERYTHING below it
    children: [
      { path: "/onboarding", element: <Onboarding /> }, 
      { path: "/dashboard", element: <Dashboard /> },   
      { path: "/connection/:id", element: <ConnectionDetail /> },
      { path: "/add", element: <AddConnect /> },
      { path: "/subnodes", element: <Subnodes /> }, 
      { path: "/mynodes", element: <MyNodes /> }, 
      { path: "/profile", element: <Profile /> },
      { path: "/inbox", element: <Inbox /> },
      { path: "/grow", element: <GrowPage /> },
    ]
  }
]);