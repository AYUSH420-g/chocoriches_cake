import { motion } from "motion/react";
import { Loader } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className="grid h-12 w-12 place-items-center text-[#e61951]"
        >
          <Loader size={32} />
        </motion.span>
        <p className="text-sm font-bold text-[#6f7573]">Loading...</p>
      </motion.div>
    </div>
  );
}
