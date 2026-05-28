import { ShieldCheck } from "lucide-react";

export default function Terms() {
  return (
    <div className="bk-page min-h-screen bg-[#f7f7f7] py-12 md:py-16">
      <div className="bk-shell max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fff2e9] text-[#e61951]">
            <ShieldCheck size={28} />
          </span>
          <h1 className="text-3xl font-black text-[#e61951] tracking-tight sm:text-4xl">
            Terms &amp; Conditions
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#ebebeb] p-8 md:p-12 space-y-8 text-[#1f2221]">
          <section>
            <h2 className="text-xl font-black text-[#1f2221] mb-3">1. No Return After Payment</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Once the payment has been successfully processed, no returns or refunds will be entertained under any circumstances. All sales are final. Please review your order carefully before completing the payment.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="text-xl font-black text-[#1f2221] mb-3">2. No Order Cancellation After Payment</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Orders cannot be cancelled once payment has been made. Since we begin preparing your cake immediately after receiving your order to ensure maximum freshness, cancellation is not possible after payment confirmation.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="text-xl font-black text-[#1f2221] mb-3">3. Company's Final Decision</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              In the event of any major dispute, issue, or consequence related to orders, deliveries, or any other aspect of our services, the final decision will be taken solely by ChocoRiches. Our decision in such matters will be binding and conclusive.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="text-xl font-black text-[#1f2221] mb-3">4. Prohibition of Malpractice</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              Any use of malpractice, fraud, unauthorized access, misuse, or any form of abuse of the ChocoRiches website or services is strictly prohibited. If any such activity is detected, ChocoRiches reserves the right to take appropriate legal action against the individual(s) involved, including but not limited to filing a police complaint and pursuing civil or criminal proceedings as deemed necessary.
            </p>
          </section>

          <hr className="border-[#ebebeb]" />

          <section>
            <h2 className="text-xl font-black text-[#1f2221] mb-3">5. Agreement</h2>
            <p className="text-sm leading-7 text-[#6f7573]">
              By placing an order on ChocoRiches, you acknowledge that you have read, understood, and agreed to all the terms and conditions mentioned above. Continued use of our website and services constitutes your acceptance of these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
