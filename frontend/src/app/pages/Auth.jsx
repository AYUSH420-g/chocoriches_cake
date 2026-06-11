import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CakeSlice, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import { login, register, googleLogin } from "../api/client";
import { clearUserSession, isUserLoggedIn, saveUserSession } from "../utils/session";
import FullScreenLoader from "../components/FullScreenLoader";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("chocoriches_admin_token")) {
      navigate("/admin", { replace: true });
      return;
    }

    if (isUserLoggedIn()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      password: String(formData.get("password") || "")
    };

    if (!isLogin) {
      if (!payload.name.trim()) return toast.error("Full Name is required");
      if (!payload.email.trim()) return toast.error("Email Address is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return toast.error("Please enter a valid email address");
      if (!payload.phone.trim()) return toast.error("Mobile Number is required");
      if (!/^\d{10,}$/.test(payload.phone.replace(/\D/g, ""))) return toast.error("Please enter a valid mobile number (at least 10 digits)");
      if (!payload.password) return toast.error("Password is required");
      if (payload.password.length < 6) return toast.error("Password must be at least 6 characters long");
    } else {
      if (!payload.email.trim()) return toast.error("Email Address is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return toast.error("Please enter a valid email address");
      if (!payload.password) return toast.error("Password is required");
    }

    setLoading(true);
    try {
      const data = isLogin
        ? await login({ email: payload.email, password: payload.password })
        : await register(payload);

      if (data.user?.role === "admin") {
        clearUserSession();
        localStorage.setItem("chocoriches_admin_token", data.token);
        toast.success("Admin login successful");
        navigate("/admin");
        return;
      }

      saveUserSession(data);
      toast.success(isLogin ? "Welcome back" : "Account created");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const data = await googleLogin({ access_token: tokenResponse.access_token });
        
        if (data.user?.role === "admin") {
          clearUserSession();
          localStorage.setItem("chocoriches_admin_token", data.token);
          toast.success("Admin login successful");
          navigate("/admin");
          return;
        }

        saveUserSession(data);
        toast.success("Logged in with Google");
        navigate("/");
      } catch (error) {
        toast.error(error.message || "Google Authentication failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google Login failed"),
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <div className="bk-page bg-white lg:bg-[#f7f7f7]">
      <FullScreenLoader visible={loading} />
      <button
        type="button"
        aria-label="Go back"
        title="Back"
        onClick={handleBack}
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#1f2221] shadow-md shadow-black/10 ring-1 ring-[#ebebeb] lg:hidden"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="min-h-screen bg-white lg:hidden">
        <div className="relative h-[270px] overflow-hidden bg-[#ffd8dc]">
          <img
            src="https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781208224/chocoriches_migrated/auth-banner.jpg"
            alt="Celebration cake with berries and flowers"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent" />
          <div className="absolute left-6 top-[120px]">
            {/* <p className="text-[28px] font-black italic leading-none text-[#303533]">Life is Short</p>
            <p className="mt-2 text-[21px] font-black leading-none text-[#303533]">Eat More Cake!</p> */}
          </div>
        </div>

        <div className="relative -mt-8 rounded-t-[28px] bg-white px-6 pb-10 pt-16 shadow-[0_-10px_22px_rgba(0,0,0,0.08)]">
          <div className="absolute left-1/2 top-0 grid h-18 w-18 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#e61951] shadow-lg shadow-black/15">
            <CakeSlice size={32} />
            
          </div>

          <div className="text-center">
            <h1 className="text-[18px] font-black leading-tight text-[#171a17] sm:text-[28px]">
              {isLogin ? "Sign Up/Login to ChocoRiches!" : "Create Account"}
            </h1>
            {/* <p className="mt-3 text-base font-bold leading-6 text-[#4e5350]">For a personalized experience & faster checkout</p> */}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "mobile-login" : "mobile-register"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
            >
              {!isLogin && <MobileField icon={User} label="Full Name" name="name" placeholder="Enter full name" required />}
              <MobileField icon={Mail} label="Email Address" name="email" type="email" placeholder="Enter email address" required />
              {!isLogin && <MobileField icon={Phone} label="Mobile Number" name="phone" placeholder="Enter mobile number" required />}
              <MobileField icon={Lock} label="Password" name="password" type="password" placeholder="Enter password" required />
              {isLogin && (
                <div className="flex justify-end text-sm">
                  <Link to="/forgot-password" className=" font-normal text-[#e61951]">Forgot Password?</Link>
                </div>
              )}
              <button type="submit" disabled={loading} className="bk-btn h-[48px] w-full text-base disabled:opacity-60">
                {loading ? "Please wait..." : "Continue"}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#eeeeee]" />
            <span className="text-[12px] font-bold text-[#777]">{isLogin ? "or Login with" : "or Sign up with"}</span>
            <span className="h-px flex-1 bg-[#eeeeee]" />
          </div>

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="flex h-[48px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#dfe3e1] bg-white text-sm font-black text-[#1f2221] transition hover:bg-[#f7f7f7] disabled:opacity-60"
          >
            <GoogleLogo />
            Continue with Google
          </button>

          <p className="mt-5 text-center text-sm font-bold text-[#555b58]">
            {isLogin ? "New to ChocoRiches?" : "Already have an account?"}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-1 font-black text-[#e61951]">
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-[#6f7573]">
            By continuing you agree to ChocoRiches <Link to="/terms" className="underline font-semibold ">Terms & Conditions</Link>
          </p>
        </div>
      </div>

      <div className="bk-shell hidden min-h-screen place-items-center py-8 lg:grid">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-[#ebebeb] md:rounded-xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden bg-[#fff2e9] p-10 lg:block">
            <img
              src="https://res.cloudinary.com/dyk0mzxqu/image/upload/v1781208224/chocoriches_migrated/auth-banner.jpg"
              alt="Celebration cake with berries and flowers"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />
            <div className="relative z-10 flex h-full flex-col justify-between text-white">
              <Link to="/" className="flex items-center gap-2 text-2xl font-black">
                <CakeSlice size={28} />
                ChocoRiches
              </Link>
              <div>
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#e61951]">Fresh Rewards</span>
                <h1 className="mt-5 text-4xl font-black leading-tight">Login to track orders, favourites, and cake occasions.</h1>
                <p className="mt-4 max-w-sm text-sm font-bold leading-6 text-white/85">A clean account area for repeat cake shopping and saved delivery details.</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-10">
            <div className="mb-6 text-center md:mb-8 lg:text-left">
              <h1 className="text-[22px] font-black tracking-tight text-[#1f2221] md:text-3xl">{isLogin ? "Login / Signup" : "Create Account"}</h1>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-lg bg-[#f7f7f7] p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`h-11 rounded-md text-sm font-black transition ${isLogin ? "bg-white text-[#e61951] shadow-sm" : "text-[#6f7573]"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`h-11 rounded-md text-sm font-black transition ${!isLogin ? "bg-white text-[#e61951] shadow-sm" : "text-[#6f7573]"}`}
              >
                Register
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                onSubmit={handleSubmit}
                className="space-y-4 md:space-y-5"
              >
                {!isLogin && (
                  <Field icon={User} label="Full Name" name="name" placeholder="Ayush Sharma" required />
                )}
                <Field icon={Mail} label="Email Address" name="email" type="email" placeholder="ayush@example.com" required />
                {!isLogin && <Field icon={Phone} label="Mobile Number" name="phone" placeholder="98765 43210" required />}
                <Field icon={Lock} label="Password" name="password" type="password" placeholder="Enter password" required />

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 font-bold text-[#6f7573]">
                      <input type="checkbox" className="h-4 w-4 accent-[#e61951]" />
                      Remember me
                    </label>
                    <Link to="/forgot-password" className="font-black text-[#e61951]">Forgot Password?</Link>
                  </div>
                )}

                <button type="submit" disabled={loading} className="bk-btn h-12 w-full text-sm disabled:opacity-60">
                  {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </motion.form>
            </AnimatePresence>

            <div className="my-6 flex items-center gap-3 md:my-7">
              <span className="h-px flex-1 bg-[#ebebeb]" />
              <span className="text-xs font-black uppercase text-[#9a9f9d]">or</span>
              <span className="h-px flex-1 bg-[#ebebeb]" />
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#ebebeb] bg-white text-sm font-black text-[#1f2221] transition hover:bg-[#f7f7f7] disabled:opacity-60"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            <p className="mt-6 text-center text-xs leading-5 text-[#6f7573]">
              By continuing, you agree to ChocoRiches terms, privacy policy, and cake delivery updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, name, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1f2221]">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9f9d]" size={18} />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className="bk-input h-12 px-4 pl-12 text-sm"
        />
      </span>
    </label>
  );
}

function MobileField({ icon: Icon, label, name, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#505453]" size={23} />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className="h-[48px] w-full rounded-[10px] border border-[#dfe3e1] bg-white px-4 pl-14 text-base font-bold text-[#1f2221] outline-none transition focus:border-[#e61951] focus:ring-4 focus:ring-[#e61951]/10"
        />
      </span>
    </label>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export {
  Auth as default
};
