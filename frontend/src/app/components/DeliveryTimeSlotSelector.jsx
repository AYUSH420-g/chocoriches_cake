import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const SLOTS = [
  { label: "07:00 PM - 10:00 PM", startHour: 19, startMin: 0 },
  { label: "11:15 PM - 11:45 PM", startHour: 23, startMin: 15 },
];

export default function DeliveryTimeSlotSelector() {
  const [selectedSlot, setSelectedSlot] = useState(
    () => sessionStorage.getItem("chocoriches_time_slot") || ""
  );
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const checkSlots = () => {
      const deliveryDateStr = sessionStorage.getItem("chocoriches_delivery_date");
      if (!deliveryDateStr) {
        setAvailableSlots(SLOTS.map(s => s.label));
        return;
      }
      const deliveryDate = new Date(deliveryDateStr);
      const now = new Date();
      
      const isToday =
        deliveryDate.getDate() === now.getDate() &&
        deliveryDate.getMonth() === now.getMonth() &&
        deliveryDate.getFullYear() === now.getFullYear();

      if (!isToday) {
        setAvailableSlots(SLOTS.map(s => s.label));
        return;
      }

      const validSlots = SLOTS.filter((slot) => {
        const slotStart = new Date();
        slotStart.setHours(slot.startHour, slot.startMin, 0, 0);
        // Current time + 2 hours
        const cutoffTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        return cutoffTime < slotStart;
      }).map(s => s.label);

      setAvailableSlots(validSlots);
      
      if (selectedSlot && !validSlots.includes(selectedSlot)) {
         setSelectedSlot("");
         sessionStorage.removeItem("chocoriches_time_slot");
      }
    };
    
    checkSlots();
    // Re-check every minute just in case
    const interval = setInterval(checkSlots, 60000);
    return () => clearInterval(interval);
  }, [selectedSlot]);

  const handleSelect = (slot) => {
    setSelectedSlot(slot);
    sessionStorage.setItem("chocoriches_time_slot", slot);
  };

  if (availableSlots.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-[#fff2e9] p-3 text-xs text-[#e63946] font-bold flex items-center gap-2">
        <Clock size={14} />
        No delivery slots available for the selected date. Please select a different date.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-[#f7f7f7] pt-1">
      <h4 className="mb-2 text-sm font-normal text-[#1f2221] md:text-base">
        {/* <Clock size={13} className="text-[#6f7573]"/> */}
        Select Delivery Time Slot
      </h4>
      <div className="flex flex-wrap gap-2">
        {availableSlots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => handleSelect(slot)}
            className={`px-3 py-1.5 rounded-md text-[10px] md:text-[11px] font-bold border transition-colors ${
              selectedSlot === slot
                ? "border-[#3e3e3e] bg-[#3e3e3e] text-white"
                : "border-[#ebebeb] bg-[#fbfbfb] text-[#6f7573] hover:border-[#b6bab8]"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
