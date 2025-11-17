import React, { useState } from 'react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  function handleNavClick(e, target) {
    if (!target || target.startsWith('http')) return;

    e.preventDefault();
    setOpen(false);
    const map = {
      home: 'banner',
      mission: 'home',
      boys: 'boys',
    };
    const id = map[target.replace('#', '')] || target.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        history.replaceState(null, '', `#${id}`);
      } catch {}
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' }); //smooth scroll for the win
    }
  }

  return (
    <>
      <button
        className={`nav-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span className="hamburger">
          <span />
          <span />
          <span />
        </span>
      </button>

      <nav className={`side-nav ${open ? 'open' : ''}`} aria-hidden={!open}>
        <ul>
          <li>
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')}>Home</a>
          </li>
          <li>
            <a href="#mission" onClick={(e) => handleNavClick(e, '#mission')}>The Mission</a>
          </li>
          <li>
            <a href="#boys" onClick={(e) => handleNavClick(e, '#boys')}>The Boys</a>
          </li>
          <li>
            <a href="https://www.youtube.com/@ricksahuman" target="_blank" rel="noreferrer">website by</a>
          </li>
        </ul>
      </nav>

      {/*scroll to top grammy button*/}
      <button
        type="button"
        aria-label="Back to top"
        title="Back to top"
        onClick={() => {
          const el = document.getElementById('banner');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: 'none',
          padding: 6,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
          background: 'linear-gradient(180deg, var(--pink), #ff93ae)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'transform .12s ease, box-shadow .12s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.32)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.28)';
        }}
      >
        <img
          src="/grammy.png"
          alt="Grammy button"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 999,
            pointerEvents: 'none',
          }}
        />
      </button>

      <style>{`
        /*i didnt ensure the side-nav links were keyboard friendly*/
        button[aria-label="Back to top"]:focus {
          outline: 3px solid rgba(255,255,255,0.9);
          outline-offset: 3px;
        }
        .side-nav a { cursor: pointer; }
      `}</style>
    </>
  );
}
