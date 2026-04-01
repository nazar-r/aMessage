import * as types from "../tsx.extensions/types";
import { authFetching } from "../tsx.extensions/fetching/fetching";
import GoogleIcon from "../tsx.extensions/assets/google.pic";
import GithubIcon from "../tsx.extensions/assets/github.pic";

const buttons: types.ButtonConfig[] = [
  { key: "google", label: "Via Google", icon: GoogleIcon },
  { key: "github", label: "Via Github", icon: GithubIcon },
];

export const RenderingButtons = () => (
  <div className="login-page__button-container">
    {buttons.map((item) => (
      <div key={item.key} className="login-page__button" onClick={() => authFetching(item)}>
        <div className="login-page__button--title">
          <div className="login-page__button--title-text">{item.label}</div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="login-page__button--icon">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <item.icon />
      </div>
    ))}
  </div>
);