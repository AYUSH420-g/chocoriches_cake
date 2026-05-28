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
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const Faq = lazy(() => import("./pages/Faq"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

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
      { path: "track", element: <LazyPage Component={TrackOrder} /> },
      { path: "about", element: <LazyPage Component={About} /> },
      { path: "contact", element: <LazyPage Component={Contact} /> },
      { path: "terms", element: <LazyPage Component={Terms} /> },
      { path: "return-policy", element: <LazyPage Component={ReturnPolicy} /> },
      { path: "faq", element: <LazyPage Component={Faq} /> },
      { path: "forgot-password", element: <LazyPage Component={ForgotPassword} /> },
      { path: "reset-password", element: <LazyPage Component={ResetPassword} /> }
    ]
  }
]);
export {
  router
};
