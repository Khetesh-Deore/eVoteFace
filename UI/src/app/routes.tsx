import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Elections from "./pages/Elections";
import ElectionDetail from "./pages/ElectionDetail";
import ElectionResults from "./pages/ElectionResults";
import VoterDashboard from "./pages/VoterDashboard";
import VotingPage from "./pages/VotingPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminElections from "./pages/admin/AdminElections";
import CreateElection from "./pages/admin/CreateElection";
import ManageElection from "./pages/admin/ManageElection";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "elections", Component: Elections },
      { path: "elections/:id", Component: ElectionDetail },
      { path: "elections/:id/results", Component: ElectionResults },
      {
        path: "dashboard",
        element: <ProtectedRoute><VoterDashboard /></ProtectedRoute>,
      },
      {
        path: "elections/:id/vote",
        element: <ProtectedRoute><VotingPage /></ProtectedRoute>,
      },
      { path: "admin/login", Component: AdminLogin },
      {
        path: "admin/dashboard",
        element: <AdminRoute><AdminDashboard /></AdminRoute>,
      },
      {
        path: "admin/elections",
        element: <AdminRoute><AdminElections /></AdminRoute>,
      },
      {
        path: "admin/elections/new",
        element: <AdminRoute><CreateElection /></AdminRoute>,
      },
      {
        path: "admin/elections/:id",
        element: <AdminRoute><ManageElection /></AdminRoute>,
      },
    ],
  },
]);
