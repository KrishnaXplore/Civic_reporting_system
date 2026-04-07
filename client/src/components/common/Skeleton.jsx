const Skeleton = ({ width = '100%', height = 16, radius = 8, className = '' }) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }}
  />
);

// Inject shimmer keyframes once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-style';
  style.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(style);
}

export default Skeleton;
