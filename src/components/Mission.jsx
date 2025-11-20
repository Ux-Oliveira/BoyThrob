import React, { useState } from 'react';
import useSWR from 'swr';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Mission() {
  const { data, error } = useSWR('/api/tiktok-followers?user=boy.throb', fetcher, {
    refreshInterval: 60000,
  });

  const followers = data?.followers ?? null;
  const isLoading = !data && !error;

  const [showRaw, setShowRaw] = useState(false);

  const hasError = Boolean(error || data?.error || data?.note || (data && data.followers === null && !data?.cached && !data?.debug));
  const noteText = data?.note || data?.error || (data && data.followers === null ? 'no follower value found' : null);
  const debugObj = data?.debug ?? data;

  return (
    <section id="home" className="home">
      <div className="missionInner">
        <h1 className="missionTitle">We need 1 million followers!</h1>
        <p className="missionSub muted">
          To get our member Darshan a U.S. Visa! Help us reach that goal!
        </p>

        <div className="tiktokCard center pulseAll" aria-live="polite">
          <div><a href="https://www.tiktok.com/@boy.throb/video/7567046504649592094" target="_blank"><img className="roundLogo" src="/roundlogo.png" alt="Boy Throb logo" /></a></div>
          <div className="pageName">Boy Throb followers:</div>

          <div className="followerRow">
            {isLoading ? (
              <div className="followers loading">Loading…</div>
            ) : hasError ? (
              //very visible error bar to show up if the data is not being fetched
              <div className="followers errorBox">
                <div className="errTitle">Error</div>
                <div className="errMsg">{noteText || 'Unable to fetch followers'}</div>
              </div>
            ) : followers === null ? (
              <div className="followers noData">—</div>
            ) : (
              <div className="followers success">{Number(followers).toLocaleString()}</div>
            )}
          </div>

          <div className="socialRow icons">
            <a id="tik" href="https://www.tiktok.com/@boy.throb" target="_blank" rel="noreferrer" aria-label="Open TikTok">
              <FontAwesomeIcon icon={faTiktok} size="2x" />
            </a>
            <a id="insta" href="https://www.instagram.com/boy.throb/" target="_blank" rel="noreferrer" aria-label="Open Instagram">
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
          </div>

          {showRaw && (
            <pre style={{ maxWidth: 760, width: '100%', margin: '12px auto 0', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 12, borderRadius: 8, background: '#111', color: '#fff', fontSize: 12 }}>
              {JSON.stringify(debugObj, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <style>{`
        .home {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px 16px; /* reduced from 30/40 — less yellow above the H1 */
          background: var(--yellow);
        }

        .missionInner {
          max-width: 760px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px; /* slightly reduced gap for compactness on narrow screens */
        }

        .missionTitle {
          margin: 0;
          font-family: 'Luckiest Guy', system-ui, sans-serif;
          font-size: 34px;
          line-height: 1.02;
          color: var(--ink);
          text-shadow: 0 4px 0 rgba(0, 0, 0, 0.06);
        }

        .missionSub {
          margin: 0;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.62);
        }

        .tiktokCard {
          margin-top: 12px; /* pull card slightly up so title sits closer to it */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 14px; /* modest padding so elements have breathing room on small screens */
          border-radius: 12px;
        }

        .roundLogo {
          width: 110px;
          height: 110px;
          border-radius: 999px;
          object-fit: cover;
          border: 6px solid var(--pink);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .pageName {
          font-weight: 800;
          font-size: 18px;
        }

        .followerRow { min-height: 56px; display:flex; align-items:center; justify-content:center; width:100%; }

        .followers {
          font-weight: 800;
          font-size: 24px;
          letter-spacing: 0.3px;
        }

        .followers.loading { opacity: .85; color: #444; background:#000; color:#fff; padding:8px 14px; border-radius:8px; min-width:120px; text-align:center; }
        .followers.success { color: var(--ink); background: transparent; padding: 2px 6px; border-radius:6px; }
        .followers.noData { color: rgba(0,0,0,0.45); background:transparent; }

        .followers.errorBox {
          background: #ffecec;
          border: 2px solid #ff5c5c;
          color: #7a0000;
          padding: 8px 12px;
          border-radius: 10px;
          min-width: 180px;
        }
        .followers.errorBox .errTitle { font-weight:800; margin-bottom:4px; }
        .followers.errorBox .errMsg { font-size:13px; opacity:0.95; }

        .socialRow.icons {
          display: flex;
          gap: 18px;
          margin-top: 8px;
          align-items: center;
          justify-content: center;
        }

        .socialRow.icons a { color: var(--ink); text-decoration: none; transition: transform .15s ease; }
        .socialRow.icons a:hover { transform: translateY(-3px); }

        @media (min-width:900px) {
          .missionTitle { font-size: 42px; }
          .roundLogo { width: 140px; height: 140px; }
          .followers { font-size: 32px; }
        }


        
        @media (max-width: 360px) {
          .missionTitle { font-size: 24px; }
          .missionSub { font-size: 14px; }
          .followers { font-size: 18px; }
          .roundLogo { width: 84px; height: 84px; }
        }

        #tik {
        color: grey;
        font-size: 18px;
        }

          #insta {
        color: white;
        font-size: 18px;
        }

      `}</style>
    </section>
  );
}

