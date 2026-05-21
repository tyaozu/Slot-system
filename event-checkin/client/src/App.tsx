import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import SearchPage from "./components/SearchPage";
import { apiPath } from "./lib/api";

export type Customer = {
  row: number;
  顧客番号: string;
  氏名: string;
  ふりがな: string;
  店舗: string;
  担当者: string;
  同伴者の人数: number;
  お酒が飲めるか: string;
  チェックイン済み: string;
  チェックイン時刻: string;
};

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch(apiPath("/auth/status"), {
          credentials: "include"
        });
        const data = (await response.json()) as { loggedIn: boolean };
        setLoggedIn(data.loggedIn);
      } catch {
        setLoggedIn(false);
      }
    };
    void check();
  }, []);

  if (loggedIn === null) {
    return <div className="page-center">読み込み中...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          loggedIn ? (
            <Navigate to="/search" replace />
          ) : (
            <LoginPage onLoginSuccess={() => setLoggedIn(true)} />
          )
        }
      />
      <Route
        path="/search"
        element={
          loggedIn ? (
            <SearchPage onLogout={() => setLoggedIn(false)} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={loggedIn ? "/search" : "/"} replace />} />
    </Routes>
  );
}

export default App;
