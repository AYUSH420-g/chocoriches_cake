import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export default function TopLoader() {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    
    // Simulate a loading delay (you can adjust this timing)
    const timeout = setTimeout(() => {
      setIsAnimating(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ width: "0%", opacity: 1 }}
          animate={{ width: "100%", opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed top-0 left-0 z-[9999] h-[3px] bg-[#e61951] shadow-[0_0_10px_#e61951]"
        />
      )}
    </AnimatePresence>
  );
}
