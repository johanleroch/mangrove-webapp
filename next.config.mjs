/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./env.mjs")

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  reactStrictMode: true,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  images: {
    domains: ["explorer-api.walletconnect.com"],
  },
  async redirects() {
    return Promise.resolve([
      {
        source: "/",
        destination: "/trade",
        permanent: true,
      },
    ])
  },
}

export default config
