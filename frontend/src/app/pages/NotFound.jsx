import { motion } from "motion/react";
import { SearchX, Home } from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Abstract background shapes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-rose-600 drop-shadow-sm">
                404
              </h1>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
                <SearchX className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">
            Page Not Found
          </h2>
          
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <button 
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-medium rounded-full shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:-translate-y-0.5 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
