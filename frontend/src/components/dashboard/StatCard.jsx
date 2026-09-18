function StatCard({ label, value, helper }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{helper}</span>
    </article>
  );
}

export default StatCard;

