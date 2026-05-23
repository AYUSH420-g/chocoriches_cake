import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CustomCake from "./pages/CustomCake";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import TrackOrder from "./pages/TrackOrder";
const router = createBrowserRouter([
  { path: "/admin", Component: Admin },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "shop", Component: Shop },
      { path: "product/:id", Component: ProductDetail },
      { path: "custom", Component: CustomCake },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "auth", Component: Auth },
      { path: "profile", Component: Profile },
      { path: "track", Component: TrackOrder }
    ]
  }
]);
export {
  router
};
