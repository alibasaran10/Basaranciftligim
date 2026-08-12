import { configureStore } from "@reduxjs/toolkit";

import sessionReducer from "./slices/sessionSlice";
import themeReducer from "./slices/themeSlice";
import uiReducer from "./slices/uiSlice";
import workspaceReducer from "./slices/workspaceSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      theme: themeReducer,
      session: sessionReducer,
      ui: uiReducer,
      workspace: workspaceReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
