/** Sub-path the site is served from (e.g. "/Eliott.SNKRS" on GitHub Pages), "" locally. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a file from /public with the base path (plain <img> tags don't get it automatically). */
export const asset = (path: string) => `${BASE_PATH}${path}`;
