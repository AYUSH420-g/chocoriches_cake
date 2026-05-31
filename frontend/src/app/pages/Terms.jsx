import { ShieldCheck } from "lucide-react";

export default function Terms() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-6 md:py-16">
      <div className="bk-shell max-w-4xl mx-auto">
        <div className="mb-6 text-center md:mb-10">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#fff2e9] text-[#e61951] md:mb-4 md:h-14 md:w-14">
            <ShieldCheck size={28} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[#e61951] sm:text-4xl">
            Terms &amp; Conditions
          </h1>
        </div>

        <div className="space-y-6 rounded-lg border border-[#ebebeb] bg-white p-5 text-[#1f2221] shadow-sm md:space-y-8 md:rounded-2xl md:p-12">
          <section>
            <h2 className="mb-3 text-lg font-black text-[#1f2221] md:text-xl">1. No Return After Payment</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Once the payment has been successfully processed, no returns or refunds will be entertained under any circumstances. All sales are final. Please review your order carefully before completing the payment.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="mb-3 text-lg font-black text-[#1f2221] md:text-xl">2. No Order Cancellation After Payment</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Orders cannot be cancelled once payment has been made. Since we begin preparing your cake immediately after receiving your order to ensure maximum freshness, cancellation is not possible after payment confirmation.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="mb-3 text-lg font-black text-[#1f2221] md:text-xl">3. Company's Final Decision</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              In the event of any major dispute, issue, or consequence related to orders, deliveries, or any other aspect of our services, the final decision will be taken solely by ChocoRiches. Our decision in such matters will be binding and conclusive.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="mb-3 text-lg font-black text-[#1f2221] md:text-xl">4. Prohibition of Malpractice</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Any use of malpractice, fraud, unauthorized access, misuse, or any form of abuse of the ChocoRiches website or services is strictly prohibited. If any such activity is detected, ChocoRiches reserves the right to take appropriate legal action against the individual(s) involved, including but not limited to filing a police complaint and pursuing civil or criminal proceedings as deemed necessary.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="mb-3 text-lg font-black text-[#1f2221] md:text-xl">5. Agreement</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              By placing an order on ChocoRiches, you acknowledge that you have read, understood, and agreed to all the terms and conditions mentioned above. Continued use of our website and services constitutes your acceptance of these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
