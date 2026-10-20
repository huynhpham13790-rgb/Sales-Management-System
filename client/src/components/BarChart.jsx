// Biểu đồ cột SVG đơn giản, không cần thư viện ngoài
export default function BarChart({ data, valueKey, labelKey, format = (v) => v, height = 200 }) {
  if (!data?.length) return <p className="muted">Chưa có dữ liệu</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey]))) || 1;
  const w = 100 / data.length;
  return (
    <div className="bar-chart">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ height }}>
        {data.map((d, i) => {
          const h = (Number(d[valueKey]) / max) * (height - 4);
          return (
            <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx="0.5" className="bar">
              <title>{`${d[labelKey]}: ${format(d[valueKey])}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="bar-labels">
        <span>{data[0][labelKey]}</span>
        <span>{data[data.length - 1][labelKey]}</span>
      </div>
    </div>
  );
}
