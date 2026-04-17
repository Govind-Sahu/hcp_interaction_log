import { configureStore } from "@reduxjs/toolkit";
import interactionReducer from "./slices/interactionSlice";
import hcpReducer from "./slices/hcpSlice";

export const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    hcp: hcpReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
