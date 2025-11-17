// src/components/Boys.jsx
import React, { useState } from 'react';

const boys = [
  {
    id: 1,
    name: 'Anthony Key',
    img: '/anthony1r.png',
    alt: '/anthony2.png',
    desc: 'K-E-Y KEY! The album that released Anthony Jameskey into the stratosphere. He only came back to Earth to be the Heart-Throb of the group!',
    link: 'https://www.tiktok.com/@anthonyjameskey',
  },
  {
    id: 2,
    name: 'Evan Papier',
    img: '/evan1.png',
    alt: '/evan2.png',
    desc: 'The thriving solo artist and the voice behind the hit single Pretty Breath. Evan is the Sweet-Drama of the group.',
    link: 'https://www.tiktok.com/@evanpapier1',
  },
  {
    id: 3,
    name: 'Zach Sobania',
    img: '/zach1r.png',
    alt: '/zach2.png',
    desc: 'Zach is the Smart One. He brings moves in a big time rush! Blink it and you miss it.',
    link: 'https://www.tiktok.com/@zacharysobania',
  },
  {
    id: 4,
    name: 'Darshan Magdum',
    img: '/darshan1.png',
    alt: '/darshan2.png',
    desc: 'Darshan is across the fucking world! Stuck in India like the Bad Boy he is. You can bring him to the U.S.A but your heart is his place to stay!',
    link: 'https://www.tiktok.com/@darshannmagdum',
  },
];

export default function Boys() {
  const [modal, setModal] = useState(null); // modal holds the boy object
  const [modalSide, setModalSide] = useState('right'); // which side image sits on in modal: 'left' | 'right'

  function openModal(boy, index) {
    // For alternating effect: if index is even (0,2...) image-left in list -> show modal image on right.
    const imageWasLeft = index % 2 === 0;
    setModalSide(imageWasLeft ? 'right' : 'left');
    setModal(boy);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    setModal(null);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  return (
    <section id="boys" className="boys">
      <div className="content center">
        <h1 className="boysHeadline">The next biggest boy band in the world. Help them get Darshan an U.S. Visa to bring him to America!</h1>

        <div className="boysGrid" role="list">
          {boys.map((b, i) => {
            const imageLeft = i % 2 === 0; // alternate
            return (
              <article
                key={b.id}
                role="listitem"
                className={`boyItemAlt ${imageLeft ? 'imageLeft' : 'imageRight'}`}
                onClick={() => openModal(b, i)}
                data-index={b.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openModal(b, i);
                }}
                aria-label={`Open ${b.name} profile`}
              >
                <div className="thumbWrap">
                  <img src={b.img} alt={b.name} className="thumb" />
                </div>

                <div className="meta">
                  <div id={`boy-name-${b.id}`} className="name">{b.name}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="bt-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.name} details`}
          onClick={(e) => {
            if (e.target.classList && e.target.classList.contains('bt-modal')) closeModal();
          }}
        >
          <div className={`bt-card ${modalSide === 'right' ? 'imgRight' : 'imgLeft'}`}>
            {/* Close */}
            <button className="bt-close" aria-label="Close" onClick={closeModal}>
              ✕
            </button>

            {/* Content layout: text + image (order depends on modalSide) */}
            <div className="bt-inner">
              <div className="bt-text">
                <h2 className="bt-name">{modal.name}</h2>
                <p className="bt-desc">{modal.desc}</p>
                <div className="bt-actions">
                  <a
                    className="bt-follow"
                    href={modal.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span>Follow them on TikTok</span>
                  </a>
                </div>
              </div>

              <div className="bt-imageWrap">
                <img src={modal.alt} alt={`${modal.name} alternate`} className="bt-big" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles (component-scoped inline to avoid style.css overrides) */}
      <style>{`
        /* Basic layout for the section */
        .boys { position: relative; padding: 36px 18px; background: var(--yellow); }
        .boys .boysHeadline { max-width: 960px; margin: 0 auto 20px; font-size: 20px; line-height:1.15; color: var(--white); font-weight:700; }

        /* Grid of items */
        .boysGrid { display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 980px; margin: 0 auto; align-items: center; }

        /* Each item alternative layout */
        .boyItemAlt { display:flex; align-items:center; gap: 14px; background: rgba(255,255,255,0.04); padding: 12px; border-radius: 12px; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
        .boyItemAlt:focus { outline: 3px solid rgba(0,0,0,0.08); outline-offset: 3px; }
        .boyItemAlt:hover { transform: translateY(-6px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }

        .thumbWrap { flex: 0 0 auto; width: 34%; max-width: 220px; position: relative; display:flex; align-items:center; justify-content:center; }
        /* enforce consistent visual size for all thumbs (match Anthony's size visually) */
        .thumb { width: 100%; height: 280px; border-radius: 12px; object-fit: cover; display:block; }

        .meta { flex: 1 1 auto; display:flex; align-items:center; justify-content:flex-start; padding: 50 12px; padding-left: 362px; }
        .meta .name { font-family: 'Luckiest Guy', system-ui, sans-serif; font-size: 22px; color: var(--yellow); font-weight:800; display:inline-block; }

        /* Alternate ordering when image on right */
        .boyItemAlt.imageRight { flex-direction: row-reverse; }
        .boyItemAlt.imageRight .meta { justify-content:flex-end; text-align:right; }
        .boyItemAlt.imageRight .meta .name { text-align: right; }

        /* Desktop: two-column stacked style (alternating) */
        @media (min-width: 820px) {
          .boysGrid { grid-template-columns: 1fr; gap: 18px; }
          /* Make items taller */
          .boyItemAlt { padding: 18px; }
          .thumbWrap { width: 36%; max-width: 320px; }
          .meta .name { font-size: 26px; }
          .thumb { height: 320px; } /* slightly taller on larger screens */
        }

        /* Modal overlay (centered card) */
        .bt-modal { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.56); z-index:1600; padding: 18px; }
        .bt-card { width: min(980px, 96%); background: var(--white); border-radius: 14px; box-shadow: 0 18px 60px rgba(0,0,0,0.45); position: relative; overflow: hidden; }
        .bt-close { position: absolute; right: 12px; top: 12px; z-index: 3; border: none; background: transparent; font-size: 20px; cursor: pointer; }

        .bt-inner { display: flex; flex-direction: row; gap: 18px; align-items: stretch; padding: 26px; }

        .bt-text { flex: 1 1 48%; display:flex; flex-direction: column; justify-content: center; }
        .bt-name { margin: 0 0 8px; font-size: 32px; font-family: 'Luckiest Guy', system-ui, sans-serif; color: var(--ink); }
        .bt-desc { margin: 0 0 18px; color: rgba(0,0,0,0.75); line-height: 1.3; }
        .bt-actions { display:flex; gap: 12px; }

        .bt-follow {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration:none;
          background: linear-gradient(180deg, var(--pink), #ff93ae);
          color: white;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(254, 163, 180, 0.2);
        }

        .bt-imageWrap { flex: 1 1 52%; display:flex; align-items:center; justify-content:center; }
        .bt-big { width: 100%; height: auto; max-height: 520px; object-fit: cover; border-radius: 10px; }

        /* When modalSide is imgRight -> image sits on right (already default order). If imgLeft we flip row */
        .bt-card.imgLeft .bt-inner { flex-direction: row-reverse; }
        .bt-card.imgLeft .bt-text { text-align: right; }
        .bt-card.imgLeft .bt-actions { justify-content: flex-end; }

        /* Mobile styles: list stacked, modal stacks image on top and text below */
        @media (max-width: 520px) {
          .boys { padding: 18px 12px; }
          .boys .boysHeadline { font-size: 16px; }
          .boysGrid { display: grid; grid-template-columns: 1fr; gap: 12px; }
          .boyItemAlt { flex-direction: column; align-items: flex-start; gap: 8px; padding: 10px; }
          .thumbWrap { width: 100%; max-width: none; }
          .thumb { width: 100%; height: 220px; border-radius: 8px; }
          .meta { width: 100%; padding: 0; margin-top: 6px; display:block; }
          .meta .name { font-size: 18px; display:inline-block; transform:none !important; }

          /* Modal stacks vertically on mobile */
          .bt-inner { flex-direction: column; padding: 14px; gap: 12px; }
          .bt-text { order: 2; padding: 0; }
          .bt-imageWrap { order: 1; width: 100%; display:flex; }
          .bt-big { max-height: 360px; width: 100%; border-radius: 8px; }
          .bt-name { font-size: 22px; }
          .bt-desc { font-size: 15px; }
        }

        /* small touch improvements */
        .boyItemAlt, .bt-close, .bt-follow { -webkit-tap-highlight-color: rgba(0,0,0,0.06); }

        /* Per-name positioning overrides (unique ids) — using transform so it only shifts the text visually
           and doesn't expand the parent container. Anthony & Zach keep their original placement. Evan & Darshan shifted more left. */
        #boy-name-1 { transform: translateX(0px); }   /* Anthony - unchanged */
        #boy-name-2 { transform: translateX(-200px); } /* Evan - move left 200px visually */
        #boy-name-3 { transform: translateX(0px); }   /* Zach - unchanged */
        #boy-name-4 { transform: translateX(-200px); } /* Darshan - move left 200px visually */

      `}</style>
    </section>
  );
}
