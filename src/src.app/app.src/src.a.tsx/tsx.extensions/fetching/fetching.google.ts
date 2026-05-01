const fetchingGoogle = async () => {
  window.location.href = import.meta.env.VITE_GOOGLE_REDIRECT_URL;
};

export default fetchingGoogle;