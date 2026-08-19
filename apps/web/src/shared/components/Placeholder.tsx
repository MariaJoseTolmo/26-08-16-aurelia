interface PlaceholderProps {
  title: string;
  description?: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <section
      style={{
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 12px 30px rgba(12, 31, 56, 0.05)',
        padding: 24,
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#6a7f95',
        }}
      >
        Modulo
      </p>
      <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: '#001e39' }}>{title}</h2>
      {description ? <p style={{ margin: '12px 0 0', color: '#617183', fontSize: 15, lineHeight: 1.6 }}>{description}</p> : null}
    </section>
  );
}
