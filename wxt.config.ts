import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  // Use Manifest V3 for Firefox too (WXT defaults Firefox to MV2)
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Weborg",
    description:
      "A simple, feature-rich new tab page you can customise without code.",
    permissions: ["storage"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          // Placeholder: replace with your own ID before publishing to Firefox Add-ons
          id: "weborg@example.com",
          // data_collection_permissions needs Firefox 140+ (also the current ESR)
          strict_min_version: "140.0",
          // Weborg sends no user data anywhere
          data_collection_permissions: { required: ["none"] },
        },
      },
    }),
  }),
});
