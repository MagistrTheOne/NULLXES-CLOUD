import type { NextConfig } from "next";
const config: NextConfig = { reactStrictMode: true, images: { dangerouslyAllowSVG: true, contentDispositionType: "attachment", contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;" } };
export default config;
