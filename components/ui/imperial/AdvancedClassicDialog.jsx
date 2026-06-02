export default function AdvancedClassicDialog({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl aspect-[16/10] flex flex-col justify-center items-center px-16 py-12">

        {/* Layer nền & họa tiết SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="adv-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#2b1a08" floodOpacity="0.5" />
            </filter>

            <filter id="inner-shadow">
              <feOffset dx="1" dy="1"/>
              <feGaussianBlur stdDeviation="2" result="offset-blur"/>
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
              <feFlood floodColor="#000" floodOpacity="0.6" result="color"/>
              <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
              <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
            </filter>

            <linearGradient id="adv-gold-antique" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#735018" />
              <stop offset="20%"  stopColor="#D4AF37" />
              <stop offset="40%"  stopColor="#F9E8A2" />
              <stop offset="60%"  stopColor="#B8860B" />
              <stop offset="80%"  stopColor="#E6CA65" />
              <stop offset="100%" stopColor="#4A3206" />
            </linearGradient>

            <linearGradient id="adv-gold-highlight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#FFFFA6" />
              <stop offset="50%"  stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#5E4010" />
            </linearGradient>

            {/* Texture giấy da */}
            <pattern id="paper-texture" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40 L40 0 M-10 10 L10 -10 M30 50 L50 30" stroke="#8A6421" strokeWidth="0.5" opacity="0.04" />
              <path d="M0 0 L40 40 M-10 30 L10 50 M30 -10 L50 10" stroke="#8A6421" strokeWidth="0.5" opacity="0.02" />
            </pattern>

            {/* Đơn vị họa tiết góc — scale 0.45 để vừa với dialog 800×500 */}
            <g id="corner-sq-unit">
              <g transform="scale(0.45)" stroke="url(#adv-gold-antique)" strokeWidth="4" fill="none">
                <line x1="6"        y1="196"    x2="6"        y2="96"    />
                <line x1="8"        y1="98"     x2="17"       y2="98"    />
                <line x1="15"       y1="100"    x2="15"       y2="76"    />
                <line x1="16"       y1="78"     x2="7"        y2="78"    />
                <line x1="6"        y1="76"     x2="6"        y2="88"    />
                <line x1="3.98811"  y1="88.5"   x2="25.0119"  y2="88.5"  />
                <line x1="23"       y1="87"     x2="23"       y2="63"    />
                <line x1="22"       y1="65"     x2="1"        y2="65"    />
                <line x1="3"        y1="64"     x2="3"        y2="40"    />
                <line x1="5"        y1="42"     x2="44"       y2="42"    />
                <line x1="42"       y1="40"     x2="42"       y2="4"     />
                <line x1="40"       y1="2"      x2="64"       y2="2"     />
                <line x1="64"       y1="0"      x2="64"       y2="24"    />
                <line x1="64"       y1="22"     x2="88"       y2="22"    />
                <line x1="87"       y1="24"     x2="87"       y2="6"     />
                <line x1="89"       y1="6"      x2="77"       y2="6"     />
                <line x1="76"       y1="4"      x2="76"       y2="16"    />
                <line x1="76"       y1="14"     x2="100"      y2="14"    />
                <line x1="99"       y1="16"     x2="99"       y2="7"     />
                <line x1="97"       y1="6"      x2="212"      y2="6"     />
                <line x1="2"        y1="1"      x2="2"        y2="32"    />
                <line x1="4"        y1="3"      x2="29"       y2="3"     />
                <line x1="27"       y1="3"      x2="27"       y2="55"    />
                <line x1="29"       y1="53"     x2="17"       y2="53"    />
                <line x1="15"       y1="55"     x2="15"       y2="16"    />
                <line x1="16"       y1="18"     x2="56"       y2="18"    />
                <line x1="54"       y1="16"     x2="54"       y2="28"    />
                <line x1="56"       y1="30"     x2="3"        y2="30"    />
              </g>
            </g>
          </defs>

          {/* Nền giấy da */}
          <rect x="15" y="15" width="770" height="470" fill="#FCF8F2" filter="url(#adv-shadow)" rx="4" />
          <rect x="15" y="15" width="770" height="470" fill="url(#paper-texture)" rx="4" />

          {/* Khung viền đôi */}
          <g filter="url(#adv-shadow)">
            <rect x="25"  y="25"  width="750" height="450" stroke="url(#adv-gold-antique)"   strokeWidth="4" fill="none" rx="2" />
            <rect x="34"  y="34"  width="732" height="432" stroke="url(#adv-gold-highlight)" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7" />
          </g>

          {/* Họa tiết 4 góc — scale() lật gương để căn góc chính xác */}
          <g filter="url(#adv-shadow)">
            {/* Góc trên-trái: góc tại (25,25), tay kéo phải và xuống */}
            <use href="#corner-sq-unit" transform="translate(25, 25)" />
            {/* Góc trên-phải: lật ngang, góc tại (775,25) */}
            <use href="#corner-sq-unit" transform="translate(775, 25) scale(-1, 1)" />
            {/* Góc dưới-trái: lật dọc, góc tại (25,475) */}
            <use href="#corner-sq-unit" transform="translate(25, 475) scale(1, -1)" />
            {/* Góc dưới-phải: lật cả hai chiều, góc tại (775,475) */}
            <use href="#corner-sq-unit" transform="translate(775, 475) scale(-1, -1)" />
          </g>
        </svg>

        {/* Nội dung (nằm trên SVG) */}
        <div className="relative z-10 w-full text-center font-serif select-none flex flex-col justify-between h-full py-4">

          {/* Tiêu đề */}
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-[#4A3206] tracking-widest uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {title}
            </h2>
            <div className="flex items-center justify-center mt-3 opacity-90">
              <span className="w-20 h-[1.5px] bg-gradient-to-r from-transparent to-[#B8860B]" />
              <span className="mx-3 text-[#B8860B] text-sm font-bold">🔱</span>
              <span className="w-20 h-[1.5px] bg-gradient-to-l from-transparent to-[#B8860B]" />
            </div>
          </div>

          {/* Nội dung */}
          <div className="my-auto px-8 max-w-xl mx-auto text-[#5B4010] text-base leading-relaxed font-medium">
            {children}
          </div>

          {/* Nút đóng */}
          <div className="mb-4">
            <button
              onClick={onClose}
              className="relative px-8 py-2.5 text-[#FCF8F2] font-bold tracking-wider rounded-sm transition-all duration-300 active:scale-95 shadow-lg group overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #735018 0%, #B8860B 50%, #4A3206 100%)',
                border: '1.5px solid #F9E8A2',
                boxShadow: '0 4px 10px rgba(43,26,8,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              ĐÓNG
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
