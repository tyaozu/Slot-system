import { FormEvent, useState } from "react";
import { apiPath } from "../lib/api";

type Props = {
  onLoginSuccess: () => void;
};

function LoginPage({ onLoginSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(apiPath("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setError("パスワードが正しくありません。");
        return;
      }
      onLoginSuccess();
    } catch {
      setError("サーバーに接続できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="login-box">
        <h1 className="brand-title">RECEPTION</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
