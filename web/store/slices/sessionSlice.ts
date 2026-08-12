import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ApiUser } from "@/lib/api";

type SessionState = {
  /** null = henuz localStorage'dan okunmadi (route guard bunu bekler). */
  authenticated: boolean | null;
  remembered: boolean;
  email: string;
  user: ApiUser | null;
};

const initialState: SessionState = {
  authenticated: null,
  remembered: true,
  email: "",
  user: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    /** Basarili giristen sonra cagrilir (token'lar api katmaninda saklanir). */
    login: (state, action: PayloadAction<{ user: ApiUser; remembered: boolean }>) => {
      state.authenticated = true;
      state.user = action.payload.user;
      state.email = action.payload.user.email;
      state.remembered = action.payload.remembered;
    },
    logout: (state) => {
      state.authenticated = false;
      state.email = "";
      state.user = null;
    },
    /** Sayfa yuklenirken kayitli oturumu geri yukler. */
    hydrateSession: (state, action: PayloadAction<{ user: ApiUser | null }>) => {
      state.user = action.payload.user;
      state.email = action.payload.user?.email ?? "";
      state.authenticated = !!action.payload.user;
    },
    /** Profil guncellendiginde ust cubuktaki bilgileri tazeler. */
    setUser: (state, action: PayloadAction<ApiUser>) => {
      state.user = action.payload;
      state.email = action.payload.email;
    },
  },
});

export const { login, logout, hydrateSession, setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
