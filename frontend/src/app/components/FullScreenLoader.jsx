import { motion, AnimatePresence } from "motion/react";
import { CakeSlice } from "lucide-react";

export default function FullScreenLoader({ visible = false }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] grid place-items-center bg-white/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative grid h-10 w-10 place-items-center">
              <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#ebebeb] border-t-[#e63946]" />
            </div>
            <p className="text-sm font-bold text-[#6f7573]">Please wait...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
