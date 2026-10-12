/**
 * Frosted glass panel. Pass `glow` for a cyan halo and `as` to change the tag.
 */
export default function GlassCard({ as: Tag = 'div', className = '', glow = false, children, ...rest }) {
  return (
    <Tag
      className={`glass relative rounded-2xl ${glow ? 'glow-cyan' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
