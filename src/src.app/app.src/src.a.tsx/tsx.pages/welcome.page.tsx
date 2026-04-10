import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const WelcomePageContent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleBegin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.amessage.site/auth/check", {
        credentials: "include",
      });

      const data = await res.json();
      await new Promise(r => setTimeout(r, 300));

      if (data.user) {
        navigate("/chat-prev");
      } else {
        navigate("/login");
      }

    } catch (err) {
      await new Promise(r => setTimeout(r, 300));
      navigate("/login");
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-page-container">
        <div className="welcome-page-container__title">Welcome Here!</div>
        <div className="welcome-page-container__description">
          ... in E2E encrypted aMessage
        </div>
      </div>

      <div
        className={`welcome-page__button ${loading ? "is-loading" : ""}`}
        onClick={handleBegin}
      >
        <div className="welcome-page__button--title__container">
          <div className="welcome-page__button--title"> Begin</div>

          <div className={loading ? "loader" : ""}>
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                className="login-page__button--icon">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </div>
        </div>

        {/* <div className="welcome-page__button--title__spec-1">
          The app is currently being updated
        </div> */}

        <div className="welcome-page__button--title__spec">
          NOTE: The first launch may take up to 50 seconds for the server to start
        </div>
      </div>


    </div>
  );
};

export default WelcomePageContent;