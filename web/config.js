/* Runtime configuration for the static demo.
 *
 * The assistant is disabled by default. To enable it, run a safe, opt-in,
 * same-origin backend and set assistantEndpoint to a root-relative path, for
 * example "/api/assistant". Absolute URLs are ignored: the drawer never sends a
 * prompt to a third-party origin.
 */
window.FRESH_IRSS_DEMO = {
  assistantEndpoint: null,
};
