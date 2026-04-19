/**
 * Icon Font Awesome 6 (class-based, ví dụ: "fa-solid fa-house").
 * Mặc định aria-hidden vì thường mang tính trang trí; truyền label khi cần cho screen reader.
 */
export function FaIcon({
  icon,
  className = "",
  label,
}: {
  icon: string;
  className?: string;
  label?: string;
}) {
  return (
    <i
      className={`${icon} ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
