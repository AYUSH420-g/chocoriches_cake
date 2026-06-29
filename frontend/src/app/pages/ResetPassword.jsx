import { Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { resetPassword } from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bk-page flex min-h-screen items-center justify-center bg-[#f7f7f7] py-6 md:py-12">
      <div className="bk-shell w-full max-w-md">
        <div className="rounded-lg border border-[#ebebeb] bg-white p-5 shadow-sm md:rounded-2xl md:p-10">
          <div className="mb-6 text-center md:mb-8">
            <h1 className="text-[22px] font-black tracking-tight text-[#1f2221] md:text-2xl">Create New Password</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f7573]">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          {!token ? (
            <div className="rounded-md bg-[#e63946]/10 p-3 text-sm font-bold text-[#e63946]">
              {error}
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mb-4 rounded-md bg-[#25D366]/10 p-4 text-sm font-bold text-[#1fb253]">
                Password successfully reset! Redirecting to login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1f2221]">New Password</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9f9d]" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bk-input h-12 px-4 pl-12 text-sm"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#1f2221]">Confirm Password</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9f9d]" size={18} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bk-input h-12 px-4 pl-12 text-sm"
                  />
                </span>
              </label>

              {error && (
                <div className="rounded-md bg-[#e63946]/10 p-3 text-sm font-bold text-[#e63946]">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="bk-btn h-12 w-full text-sm disabled:opacity-60">
                {loading ? "Updating..." : "Update Password"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
