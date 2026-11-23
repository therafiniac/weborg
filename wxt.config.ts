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
    // Asked for only when someone connects the Todoist widget
    optional_host_permissions: ["https://api.todoist.com/*"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          // Permanent add-on ID: never change it, or Firefox treats the
          // add-on as a different one and settings do not carry over
          id: "weborg@therafiniac.dev",
          // data_collection_permissions needs Firefox 140+ (also the current ESR)
          strict_min_version: "140.0",
          // Nothing is sent by default. Connecting the Todoist widget sends
          // the user's API token to Todoist, so it is asked for at that point
          // (keep in sync with TODOIST_DATA_COLLECTION)
          data_collection_permissions: {
            required: ["none"],
            optional: ["authenticationInfo"],
          },
        },
      },
    }),
  }),
});
