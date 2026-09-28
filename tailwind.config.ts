import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // palet industrial dipertahankan sama seperti versi Laravel:
        // amber untuk aksen, teal untuk info lokasi/stok, neutral untuk latar.
      },
    },
  },
  plugins: [],
};
export default config;
