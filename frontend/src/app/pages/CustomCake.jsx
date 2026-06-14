import { Link } from "react-router";
import { motion } from "motion/react";
import { Camera, CheckCircle2, MessageCircle, Palette, Sparkles, Heart } from "lucide-react";

const process = [
  [MessageCircle, "Message on WhatsApp", "Reach out to us on WhatsApp to start your custom cake journey."],
  [Palette, "Share Theme & Details", "Send us your design ideas, brief topic, and the overall theme."],
  [Camera, "Send Reference Photo", "Share a reference photo and we can recreate it exactly for you!"],
  [CheckCircle2, "Fresh Bake & Delivery", "Your customized homemade cake is baked, packed, and delivered fresh."]
];

function CustomCake() {
  return (
    <div className="bk-page overflow-hidden bg-gradient-to-b from-[#fdfbf9] to-white pb-6 pt-3 md:pb-16 md:pt-3">
      <section className="bk-shell grid items-start gap-4 md:gap-8 lg:grid-cols-[400px_1fr]">
        {/* <aside className="space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-[#ebebeb] bg-white p-4 shadow-xl shadow-black/5 md:rounded-3xl md:p-8"
          >
            <h2 className="mb-5 flex items-center gap-3 text-xl font-black text-[#1f2221] md:mb-8 md:text-2xl">
              <Sparkles className="text-[#e61951]" size={24} />
              How It Works
            </h2>
            <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[22px] before:top-2 before:w-[2px] before:bg-gradient-to-b before:from-[#e61951] before:to-transparent md:space-y-8">
              {process.map(([Icon, title, copy], index) => (
                <motion.div 
                  key={title} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group relative flex gap-4 md:gap-6"
                >
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white border-2 border-[#e61951] text-[#e61951] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#e61951] group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  <div className="pt-1">
                    <p className="text-sm font-black text-[#1f2221] transition-colors group-hover:text-[#e61951] md:text-base">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6f7573]">{copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </aside> */}

        <motion.main 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-lg border border-[#ebebeb] bg-white shadow-2xl shadow-[#e61951]/5 md:rounded-3xl"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fff2e9] to-white" />
          
          <div className="relative z-10 flex flex-col items-center p-4 text-center md:p-12">
            <span className="mb-5 grid h-16 w-16 rotate-[-5deg] place-items-center rounded-xl bg-[#e61951] text-white shadow-xl shadow-[#e61951]/30 transition-transform duration-300 hover:rotate-0 md:mb-6 md:h-20 md:w-20 md:rounded-2xl">
              <Heart size={36} fill="currentColor" />
            </span>
            
            <h2 className="max-w-md text-2xl font-black leading-tight text-[#1f2221] md:text-4xl">
              Order your <span className="text-[#e61951] relative inline-block">customize pure<svg className="absolute -bottom-2 left-0 w-full h-3 text-[#e61951]/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg></span> homemade cake
            </h2>
            
            <div className="group relative mt-6 w-full max-w-lg md:mt-10">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#e61951] to-[#ff8c00] opacity-20 blur transition group-hover:opacity-40 duration-500" />
              <img 
                src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800" 
                alt="Beautiful customized cake" 
                loading="lazy"
                className="relative mx-auto h-[250px] w-full rounded-lg object-cover shadow-md transition duration-500 group-hover:scale-[1.02] md:h-[320px] md:rounded-2xl" 
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white">
                 <p className="text-xs font-black text-[#1f2221] flex items-center gap-2">
                   <CheckCircle2 size={14} className="text-[#0f8b57]" /> Pure Homemade
                 </p>
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#5f6663] md:mt-8 md:text-base md:leading-7">
              Send us your design ideas and we'll bring them to life exactly as you imagine! Perfect for birthdays, weddings, and grand celebrations.
            </p>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://wa.me/919429304484"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex h-12 w-full max-w-sm items-center justify-center gap-3 rounded-lg bg-[#25d366] px-6 text-sm font-black text-white shadow-xl shadow-[#25d366]/30 transition-all hover:bg-[#20bd5a] md:mt-8 md:h-16 md:gap-4 md:rounded-2xl md:px-8 md:text-lg"
            >
              <MessageCircle size={28} />
              Chat on WhatsApp
            </motion.a>
            <p className="mt-4 text-sm font-bold text-[#9a9f9d] tracking-wide">+91 94293 04484</p>
          </div>
        </motion.main>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-[#ebebeb] bg-white p-4 shadow-xl shadow-black/5 md:rounded-3xl md:p-8"
          >
            <h2 className="mb-5 flex items-center gap-3 text-xl font-black text-[#1f2221] md:mb-8 md:text-2xl">
              <Sparkles className="text-[#e61951]" size={24} />
              How It Works
            </h2>
            <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[22px] before:top-2 before:w-[2px] before:bg-gradient-to-b before:from-[#e61951] before:to-transparent md:space-y-8">
              {process.map(([Icon, title, copy], index) => (
                <motion.div 
                  key={title} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group relative flex gap-4 md:gap-6"
                >
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white border-2 border-[#e61951] text-[#e61951] shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#e61951] group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  <div className="pt-1">
                    <p className="text-sm font-black text-[#1f2221] transition-colors group-hover:text-[#e61951] md:text-base">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6f7573]">{copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </aside>
      </section>
    </div>
  );
}

export {
  CustomCake as default
};
