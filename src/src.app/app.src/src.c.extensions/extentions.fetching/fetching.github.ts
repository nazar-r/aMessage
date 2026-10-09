const fetchingGithub = async () => {
  window.location.href = import.meta.env.VITE_GITHUB_REDIRECT_URL;
};

export default fetchingGithub;