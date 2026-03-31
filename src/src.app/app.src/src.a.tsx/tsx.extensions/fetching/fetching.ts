import fetchingGoogle from "./fetching.google";
import fetchingGithub from "./fetching.github";
import * as types from "../types";

export const authFetching = async (item: types.ButtonConfig): Promise<void> => {
  return item.key === "google"
    ? fetchingGoogle()
    : fetchingGithub();
};