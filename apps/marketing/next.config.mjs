/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@offerpulse/lib", "@offerpulse/ui"],
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
