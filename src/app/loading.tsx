export default function Loading() {
  const rects = [
    { x: 0, y: 96, width: 64, height: 32 },
    { x: 0, y: 128, width: 64, height: 64 },
    { x: 64, y: 128, width: 64, height: 64 },
    { x: 64, y: 192, width: 64, height: 64 },
    { x: 128, y: 192, width: 64, height: 32 },
    { x: 128, y: 224, width: 64, height: 64 },
    { x: 192, y: 192, width: 64, height: 64 },
    { x: 192, y: 128, width: 64, height: 64 },
    { x: 256, y: 128, width: 64, height: 64 },
    { x: 256, y: 64, width: 64, height: 64 },
    { x: 320, y: 64, width: 64, height: 64 },
    { x: 320, y: 0, width: 64, height: 64 },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <svg
        viewBox="0 0 384 288"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-36 w-36"
      >
        <style>{`
          @keyframes popIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .rect {
            transform-origin: center;
            animation: popIn 2500ms ease infinite;
          }
        `}</style>

        {rects.map((rect, index) => (
          <rect
            key={index}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="black"
            className="rect"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </svg>
    </div>
  );
}
