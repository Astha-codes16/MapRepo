const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["mongoose", "mongodb"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), "mongoose", "mongodb"];

    return config;
  },
};

export default nextConfig;