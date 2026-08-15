// Mock Supabase client to prevent Vite import errors and runtime crashes 
// from lingering legacy frontend components until they are fully migrated to REST.
export const supabase: any = {
  from: (table: string) => ({
    select: () => {
      const chain: any = {
        eq: () => chain,
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => Promise.resolve({ data: null, error: null }),
        then: (cb: any) => { cb({ data: [], error: null }); return Promise.resolve({ data: [], error: null }); }
      };
      return chain;
    },
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    signInWithPassword: () => Promise.reject(new Error("Migrated to native auth")),
    signOut: () => Promise.resolve()
  }
};
