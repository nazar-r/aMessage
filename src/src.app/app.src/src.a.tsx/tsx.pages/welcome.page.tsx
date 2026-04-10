import { useNavigate } from 'react-router-dom';

const WelcomePageContent = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-page-container">
        <div className="welcome-page-container__title">Welcome Here!</div>
        <div className="welcome-page-container__description">... in E2E encrypted aMessage</div>
      </div>

      <div className="welcome-page__button" onClick={async () =>
        (await fetch("https://api.amessage.site/auth/check", { credentials: "include" }).then(res => res.json()).then(data => data.user))
          ? navigate("/chat-prev")
          : navigate("/login")
      }
      >
        <div className="welcome-page__button--title__container">
          <div className="welcome-page__button--title">Begin</div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="login-page__button--icon">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <div className="welcome-page__button--title__spec">NOTE: The first launch may take up to 50 seconds for the server to start.</div>
      </div>
    </div>
  );
};

export default WelcomePageContent;