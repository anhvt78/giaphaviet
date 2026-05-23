import React from "react";
import { X } from "lucide-react";

const Modal = ({ onClose, children, title }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f2e2ba] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f2e2ba] rounded-full transition-colors text-gray-500 hover:text-red-600 transform hover:scale-125 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
