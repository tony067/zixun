// Standalone version: useEazo replaced with useStandaloneAuth
export { useStandaloneAuth as useEazo } from "@/components/providers/standalone-auth-provider";

// Re-export a minimal auth object for components that import { auth } from "@eazo/sdk"
export const auth = {
  login: () => {
    // Trigger login modal via custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mindpace:show-login"));
    }
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mindpace_token");
      window.location.href = "/";
    }
  },
  getSessionHeader: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mindpace_token");
      return token ? { "x-session-token": token } : {};
    }
    return {};
  },
};
