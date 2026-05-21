import { useEffect, useState } from "react";
import { Customer } from "../App";

type Props = {
  customer: Customer;
  onCheckIn: (customer: Customer) => Promise<void>;
};

function CustomerCard({ customer, onCheckIn }: Props) {
  const checkedIn = customer.チェックイン済み === "済";
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    if (checkedIn) {
      setJustCheckedIn(true);
      const timer = setTimeout(() => setJustCheckedIn(false), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [checkedIn, customer.チェックイン時刻]);

  const alcoholAllowed = ["○", "◯", "〇", "⚪", "⚪︎"].includes(
    customer.お酒が飲めるか.trim()
  );
  const companionText =
    customer.同伴者の人数 > 0 ? `${customer.同伴者の人数}名` : "本人のみ";

  return (
    <article className={`customer-card ${checkedIn ? "checked-in" : ""} ${justCheckedIn ? "pulse" : ""}`}>
      <div className="card-header">
        <div>
          <h2 className="customer-name">{customer.氏名}</h2>
          <p className="customer-kana">{customer.ふりがな}</p>
        </div>
        {checkedIn && <span className="checked-badge">チェックイン済み</span>}
      </div>

      <div className="card-meta">
        <span>👥 同伴者: {companionText}</span>
        <span className={!alcoholAllowed ? "muted" : ""}>
          {alcoholAllowed ? "🍷 アルコール: 可" : "🥤 アルコール: 不可"}
        </span>
      </div>

      <div className="card-action">
        <button
          className="checkin-button"
          disabled={checkedIn}
          onClick={() => {
            void onCheckIn(customer);
          }}
        >
          {checkedIn ? "チェックイン済み ✓" : "CHECK IN"}
        </button>
      </div>
    </article>
  );
}

export default CustomerCard;
