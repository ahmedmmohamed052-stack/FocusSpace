// assets/auth-guard.js
// Include this (type="module") on any page that requires a signed-in,
// verified user. It redirects unauthenticated/unverified visitors to
// login.html, syncs the Firestore profile doc, and exposes window.FS
// with helpers the page's own script can use.
import { auth, onAuthStateChanged, isVerified, syncUserProfile, signOut } from "./firebase-init.js";

function currentPageWithQuery() {
  return location.pathname.split("/").pop() + location.search;
}

function goToLogin(extra = "") {
  const next = encodeURIComponent(currentPageWithQuery());
  location.replace(`login.html?next=${next}${extra}`);
}

window.FS = window.FS || {};

window.FS.ready = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      goToLogin();
      return;
    }
    if (!isVerified(user)) {
      goToLogin("&verify=1");
      return;
    }

    try {
      await syncUserProfile(user);
    } catch (e) {
      // Non-fatal — the page can still work even if the profile sync
      // hiccups (e.g. a transient network blip); Firestore rules will
      // still protect the data either way.
      console.error("[auth-guard] profile sync failed:", e.message);
    }

    window.FS.user = user;
    window.FS.logout = () => signOut(auth).then(() => (location.href = "login.html"));
    // Always fetches a fresh (or cached-but-valid) ID token — Firebase
    // handles the ~1hr refresh internally, this call is cheap.
    window.FS.authedFetch = async (url, opts = {}) => {
      const token = await user.getIdToken();
      return fetch(url, {
        ...opts,
        credentials: "same-origin",
        headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
      });
    };

    resolve(user);
    window.dispatchEvent(new CustomEvent("fs-auth-ready", { detail: { user } }));
  });
});
