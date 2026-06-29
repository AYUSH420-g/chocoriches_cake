import { Mail, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { forgotPassword } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await forgotPassword({ email });
      setMessage("A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bk-page flex min-h-screen items-center justify-center bg-[#f7f7f7] py-6 md:py-12">
      <div className="bk-shell w-full max-w-md">
        <div className="rounded-lg border border-[#ebebeb] bg-white p-5 shadow-sm md:rounded-2xl md:p-10">
          <div className="mb-6 text-center md:mb-8">
            <h1 className="text-[22px] font-black tracking-tight text-[#1f2221] md:text-2xl">Forgot Password?</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f7573]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#1f2221]">Email Address</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9f9d]" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bk-input h-12 px-4 pl-12 text-sm"
                />
              </span>
            </label>

            {message && (
              <div className="rounded-md bg-[#25D366]/10 p-3 text-sm font-bold text-[#1fb253]">
                {message}
              </div>
            )}
            
            {error && (
              <div className="rounded-md bg-[#e63946]/10 p-3 text-sm font-bold text-[#e63946]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="bk-btn h-12 w-full text-sm disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset Link"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm font-bold text-[#6f7573]">
            Remember your password?{" "}
            <Link to="/auth" className="text-[#e63946] hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
