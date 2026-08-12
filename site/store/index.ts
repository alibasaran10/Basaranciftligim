import { configureStore } from "@reduxjs/toolkit";

import referencesReducer from "./slices/referencesSlice";
import themeReducer from "./slices/themeSlice";
import uiReducer from "./slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      theme: themeReducer,
      ui: uiReducer,
      references: referencesReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
