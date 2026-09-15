import { defineConfig } from "vite";

export default defineConfig({
  base: "/Web-de-profesores/",
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://example.test/Web-de-profesores/",
      },
    },
    clearMocks: true,
  },
});
