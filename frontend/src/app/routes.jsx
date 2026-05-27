import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import PageLoader from "./components/PageLoader";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CustomCake = lazy(() => import("./pages/CustomCake"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  { path: "/admin", element: <LazyPage Component={Admin} /> },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <LazyPage Component={Home} /> },
      { path: "shop", element: <LazyPage Component={Shop} /> },
      { path: "product/:id", element: <LazyPage Component={ProductDetail} /> },
      { path: "custom", element: <LazyPage Component={CustomCake} /> },
      { path: "cart", element: <LazyPage Component={Cart} /> },
      { path: "checkout", element: <LazyPage Component={Checkout} /> },
      { path: "auth", element: <LazyPage Component={Auth} /> },
      { path: "profile", element: <LazyPage Component={Profile} /> },
      { path: "track", element: <LazyPage Component={TrackOrder} /> }
    ]
  }
]);
export {
  router
};
