import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/home',
    label: 'Inicio',
    iconDefault: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L3 9.5V20a1 1 0 001 1h5v-9h6v9h5a1 1 0 001-1V9.5L12 3z"/>
      </svg>
    ),
  },
  {
    path: '/adoptar',
    label: 'Adoptar',
    iconDefault: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-8-5-8-11a8 8 0 0116 0c0 6-8 11-8 11z"/>
        <circle cx="12" cy="10" r="2"/>
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a8 8 0 00-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 00-8-8zm0 10a2 2 0 110-4 2 2 0 010 4z"/>
      </svg>
    ),
  },
  {
    path: '/publicar',
    label: 'Publicar',
    isPublish: true,
    iconDefault: null,
    iconActive: null,
  },
  {
    path: '/amigos',
    label: 'Amigos',
    iconDefault: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 12a5 5 0 10-5.33-7.975A5 5 0 0013 12zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4zm6.5-8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM23 18v1h-4v-1c0-1.06-.52-2-1.42-2.74A7.08 7.08 0 0123 18z"/>
      </svg>
    ),
  },
  {
    path: '/ajustes',
    label: 'Ajustes',
    iconDefault: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.986.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"/>
      </svg>
    ),
  },
];

export default function BottomNav({ onOpenModal }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (item) => {
    if (item.isPublish) {
      if (onOpenModal) onOpenModal();
      else navigate('/publicar');
      return;
    }
    navigate(item.path);
  };

  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@500;600&display=swap');

        .ap-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(0,0,0,0.07);
          display: flex;
          align-items: stretch;
          height: 64px;
          padding-bottom: env(safe-area-inset-bottom);
          box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
        }

        @media (min-width: 768px) {
          .ap-bottom-nav { display: none; }
        }

        .ap-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          border: none;
          background: none;
          cursor: pointer;
          position: relative;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.12s ease;
        }
        .ap-nav-item:active { transform: scale(0.88); }

        .ap-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 28px;
          position: relative;
        }

        .ap-nav-label {
          font-family: 'Figtree', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition: color 0.15s;
        }

        .ap-nav-item--default .ap-nav-icon { color: #B5A89E; }
        .ap-nav-item--default .ap-nav-label { color: #B5A89E; }

        .ap-nav-item--active .ap-nav-icon { color: #E07B39; }
        .ap-nav-item--active .ap-nav-label { color: #E07B39; }

        /* Active indicator dot */
        .ap-nav-item--active::after {
          content: '';
          position: absolute;
          bottom: 6px;
          width: 4px; height: 4px;
          background: #E07B39;
          border-radius: 50%;
        }

        /* Publish button */
        .ap-nav-publish {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #E07B39, #C96A28);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(224,123,57,0.45);
          margin-bottom: 2px;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .ap-nav-item:active .ap-nav-publish {
          transform: scale(0.9);
          box-shadow: 0 2px 8px rgba(224,123,57,0.3);
        }
        .ap-nav-publish svg {
          color: white;
          flex-shrink: 0;
        }

        /* Active line top indicator */
        .ap-nav-active-line {
          position: absolute;
          top: 0;
          width: 28px;
          height: 3px;
          background: #E07B39;
          border-radius: 0 0 4px 4px;
          transition: opacity 0.15s;
        }
      `}</style>

      <nav className="ap-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);

          if (item.isPublish) {
            return (
              <button key={item.path} className="ap-nav-item" onClick={() => handleNav(item)} aria-label="Publicar">
                <div className="ap-nav-publish">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <span className="ap-nav-label" style={{ color: '#B5A89E' }}>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              className={`ap-nav-item ${active ? 'ap-nav-item--active' : 'ap-nav-item--default'}`}
              onClick={() => handleNav(item)}
              aria-label={item.label}
            >
              {active && <div className="ap-nav-active-line" />}
              <div className="ap-nav-icon">
                {active ? item.iconActive : item.iconDefault}
              </div>
              <span className="ap-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}