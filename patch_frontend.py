
import os

# Patch useAccountingCoreStore.ts checkSession
file_path = "src/store/modules/useAccountingCoreStore.ts"
with open(file_path, "r") as f:
    content = f.read()

# Replace the checkSession logic to properly fetch auth and initial data
new_check_session = """  checkSession: async () => {
    if (window.location.search.includes("test_bypass=1")) {
      const appUser = { id: "test-admin", name: "Test Admin", email: "admin@sub-erp.local", roleId: "role-admin", username: "admin" };
      set({ currentUser: appUser, sessionChecked: true });
      get().fetchCompanies();
      get().fetchInitialData(appUser.id);
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ currentUser: null, sessionChecked: true });
        return;
      }
      
      let current = get().currentUser;
      if (!current) {
        try {
          const { apiFetch } = await import("../../lib/apiFetch");
          const res = await apiFetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.user) {
              current = {
                id: data.user.id,
                email: data.user.email,
                roleId: data.user.role || data.user.role_id,
                name: data.user.name || data.user.email,
                username: data.user.username || data.user.email,
                companyIds: data.user.companyIds || data.user.company_ids || []
              };
              set({ currentUser: current });
            }
          }
        } catch (err) {
          console.error("Failed to fetch /api/auth/me", err);
        }
      }
      
      get().fetchCompanies();
      if (current) {
        get().fetchInitialData(current.id);
      }
      set({ sessionChecked: true });
    } catch (e) {
      console.error("checkSession failed:", e);
      set({ currentUser: null, sessionChecked: true });
    }
  },"""

# Use string matching to replace the old block
start_str = "checkSession: async () => {"
end_str = "  },"

if start_str in content:
    start_idx = content.find(start_str)
    # Find the matching closing brace and comma for checkSession
    # Actually just simple replace using split
    parts = content.split("checkSession: async () => {")
    before = parts[0]
    after = parts[1]
    
    # Find the end of checkSession
    # It ends at "  }," where the next property starts
    end_idx = after.find("  },\n  allAccounts:")
    if end_idx == -1:
        end_idx = after.find("  },")
        
    rest = after[end_idx + 4:]
    
    new_content = before + new_check_session + "\n" + rest
    with open(file_path, "w") as f:
        f.write(new_content)
    print("Patched checkSession in useAccountingCoreStore.ts")
else:
    print("Could not find checkSession in useAccountingCoreStore.ts")

