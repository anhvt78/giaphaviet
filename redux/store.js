import { configureStore } from "@reduxjs/toolkit";
import genealogyReducer from "./genealogySlide";

export const store = configureStore({
  reducer: { genealogyReducer },
});
