import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CakeSlice, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { login, register } from "../api/client";
import { clearUserSession, isUserLoggedIn, saveUserSession } from "../utils/session";

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
      navigate("/profile", { replace: true });
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
      navigate("/profile");
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bk-page">
      <div className="bk-shell grid min-h-[calc(100vh-118px)] place-items-center py-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#ebebeb] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden bg-[#fff2e9] p-10 lg:block">
            <img
              src="https://images.unsplash.com/photo-1605807646983-377bc5a76493?auto=format&fit=crop&q=80&w=1100"
              alt="Cake table"
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

          <div className="p-6 md:p-10">
            <div className="mb-8 text-center lg:text-left">
              <Link to="/" className="mx-auto mb-4 flex w-fit items-center gap-2 text-2xl font-black text-[#e61951] lg:hidden">
                <CakeSlice size={25} />
                ChocoRiches
              </Link>
              <h1 className="text-3xl font-black tracking-tight text-[#1f2221]">{isLogin ? "Login / Signup" : "Create Account"}</h1>
              <p className="mt-2 text-sm leading-6 text-[#6f7573]">Access orders, saved addresses, wishlist cakes, and occasion reminders.</p>
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
                className="space-y-5"
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
                    <button type="button" className="font-black text-[#e61951]">Forgot Password?</button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="bk-btn h-12 w-full text-sm disabled:opacity-60">
                  {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </motion.form>
            </AnimatePresence>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#ebebeb]" />
              <span className="text-xs font-black uppercase text-[#9a9f9d]">or</span>
              <span className="h-px flex-1 bg-[#ebebeb]" />
            </div>

            <button type="button" className="h-12 w-full rounded-lg border border-[#ebebeb] bg-white text-sm font-black text-[#1f2221] transition hover:bg-[#f7f7f7]">
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

export {
  Auth as default
};
