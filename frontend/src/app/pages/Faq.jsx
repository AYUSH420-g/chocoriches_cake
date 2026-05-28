import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Are same day cakes also made after order or are they pre-made?",
    answer:
      "No, our same day cakes are also freshly made after receiving your order. They are not pre-made. These are cakes that are easier and quicker to prepare, so our bakers can complete them within a few hours while still maintaining the same quality and freshness you expect from ChocoRiches."
  },
  {
    question: "Do you add extra sugar in any product?",
    answer:
      "No, there is no added sugar from our side. We follow our tested recipes carefully to ensure balanced sweetness in every cake. What you taste is the natural sweetness from quality ingredients we use — nothing extra is added."
  }
];

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#ebebeb] rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#fafafa]"
      >
        <span className="text-sm font-black text-[#1f2221] leading-6">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#e61951] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#ebebeb] px-5 py-4">
            <p className="text-sm leading-7 text-[#6f7573]">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-12 md:py-16">
      <div className="bk-shell max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
            <HelpCircle size={28} />
          </span>
          <h1 className="text-3xl font-black text-[#e61951] tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm font-bold text-[#6f7573]">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}
