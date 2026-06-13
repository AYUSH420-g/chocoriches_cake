import { motion } from "motion/react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  console.error("Global Error Caught:", error);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl blur opacity-20"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Oops! Site Issue
          </h1>
          
          <p className="text-zinc-400 mb-6 leading-relaxed">
            We are facing some issues right now. Please try again later. 
            Don't worry, <span className="text-orange-400 font-medium">we keep your orders in mind</span> and everything is safe.
          </p>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </motion.div>
      </div>
    </div>
  );
}
