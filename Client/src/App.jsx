import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import Login from "./components/Login";
import Register from "./components/Register";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./routes/AdminRoute";
import AdminLayout from "./layouts/AdminLayout";

/* --------------------------------------------------
   ROUTER CONFIG (React Router v6.4+)
-------------------------------------------------- */

const router = createBrowserRouter([
  /* -------- LANDING PAGE -------- */
  {
    path: "/",
    lazy: async () => {
      const { default: Overview } = await import("./pages/Overview");
      return { Component: Overview };
    },
  },

  /* -------- MAIN APP LAYOUT -------- */
  {
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "home",
        lazy: async () => {
          const { default: Home } = await import("./pages/Home");
          return { Component: Home };
        },
      },
      {
        path: "movies",
        lazy: async () => {
          const { default: Movies } = await import("./pages/Movies");
          return { Component: Movies };
        },
      },
      {
        path: "explore-movies",
        lazy: async () => {
          const { default: ExploreMovies } =
            await import("./pages/ExploreMovies");
          return { Component: ExploreMovies };
        },
      },
      {
        path: "tvshows",
        lazy: async () => {
          const { default: Tvshows } = await import("./pages/Tvshows");
          return { Component: Tvshows };
        },
      },
      {
        path: "explore-tvshows",
        lazy: async () => {
          const { default: ExploreTvshows } =
            await import("./pages/ExploreTvshows");
          return { Component: ExploreTvshows };
        },
      },
      {
        path: "search",
        lazy: async () => {
          const { default: SearchResults } =
            await import("./pages/SearchResults");
          return { Component: SearchResults };
        },
      },
      {
        path: "search",
        lazy: async () => {
          const { default: SearchResults } =
            await import("./pages/SearchResults");
          return { Component: SearchResults };
        },
      },
      {
        path: "reset-password",
        lazy: async () => {
          const { default: ResetPassword } =
            await import("./pages/ResetPassword");
          return { Component: ResetPassword };
        },
      },

      /* -------- AUTH (PUBLIC) -------- */
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      /* -------- PROTECTED MOVIE / TV DETAILS -------- */
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "movie/:id",
            lazy: async () => {
              const { default: MovieCard } = await import("./movies/MovieCard");
              return { Component: MovieCard };
            },
          },
          {
            path: "tvshow/:id",
            lazy: async () => {
              const { default: TvShowCard } =
                await import("./tvshows/TvShowCard");
              return { Component: TvShowCard };
            },
          },
          {
            path: "explore",
            lazy: async () => {
              const { default: ExploreAll } =
                await import("./pages/ExploreAll");
              return { Component: ExploreAll };
            },
          },
          {
            path: "recommendations",
            lazy: async () => {
              const { default: Recommendations } =
                await import("./pages/Recommendations");
              return { Component: Recommendations };
            },
          },
        ],
      },
    ],
  },

  /* -------- DASHBOARD (FULLY PROTECTED) -------- */
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: DashboardOverview } =
                await import("./dashboard/DashboardOverview");
              return { Component: DashboardOverview };
            },
          },
          {
            path: "home",
            lazy: async () => {
              const { default: Homepage } =
                await import("./dashboard/Homepage");
              return { Component: Homepage };
            },
          },
          {
            path: "history",
            lazy: async () => {
              const { default: History } = await import("./dashboard/History");
              return { Component: History };
            },
          },
          {
            path: "watchlater",
            lazy: async () => {
              const { default: WatchLater } =
                await import("./dashboard/WatchLater");
              return { Component: WatchLater };
            },
          },
          {
            path: "wishlist",
            lazy: async () => {
              const { default: Wishlist } =
                await import("./dashboard/Wishlist");
              return { Component: Wishlist };
            },
          },
          {
            path: "myreviews",
            lazy: async () => {
              const { default: Myreviews } =
                await import("./dashboard/Myreviews");
              return { Component: Myreviews };
            },
          },
          {
            path: "support",
            lazy: async () => {
              const { default: Support } =
                await import("./dashboard/Support");
              return { Component: Support };
            },
          },
        ],
      },
    ],
  },

  /* -------- ADMIN (ADMIN ONLY) -------- */
  {
    element: <AdminRoute />,
    children: [
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: AdminOverview } =
                await import("./admin/AdminOverview");
              return { Component: AdminOverview };
            },
          },
          {
            path: "users",
            lazy: async () => {
              const { default: AdminUsers } =
                await import("./admin/AdminUsers");
              return { Component: AdminUsers };
            },
          },
          {
            path: "movies",
            lazy: async () => {
              const { default: AdminMovies } =
                await import("./admin/AdminMovies");
              return { Component: AdminMovies };
            },
          },
          {
            path: "shows",
            lazy: async () => {
              const { default: AdminMovies } =
                await import("./admin/AdminShows");
              return { Component: AdminMovies };
            },
          },
          {
            path: "reviews",
            lazy: async () => {
              const { default: AdminReviews } =
                await import("./admin/AdminReviews");
              return { Component: AdminReviews };
            },
          },
          {
            path: "support",
            lazy: async () => {
              const { default: AdminSupport } =
                await import("./admin/AdminSupport");
              return { Component: AdminSupport };
            },
          },
        ],
      },
    ],
  },

  /* -------- GLOBAL 404 -------- */
  {
    path: "*",
    element: <NotFound />,
  },
]);

/* -------- APP ENTRY -------- */
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
