"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store"; // Kiểm tra đường dẫn store của bạn

export default function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
