import { money } from '../lib/format.js';

export default function SummaryBar({ computed, currency }) {
  const m = p => money(p, currency);
  const cards = [
    ['Opening balance', m(computed.opening), ''],
    [`Credits · ${computed.creditCount}`, m(computed.credit), 'credit'],
    [`Debits · ${computed.debitCount}`, m(computed.debit), 'debit'],
    ['Closing balance', m(computed.closing), computed.closing < 0 ? 'strong debit' : 'strong'],
    ['On statement', `${computed.count} txn${computed.count === 1 ? '' : 's'}`, ''],
  ];
  return (
    <section className="summary" aria-label={`Account summary in ${currency}`}>
      {cards.map(([label, value, tone]) => (
        <div className={`sum-card ${tone}`} key={label}>
          <span className="sum-label">{label}</span>
          <span className="sum-value">{value}</span>
        </div>
      ))}
      <p className="sum-note">Amounts in {currency} · closing = opening + credits − debits</p>
    </section>
  );
}
