export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-4 text-xs text-neutral-400">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span>© {new Date().getFullYear()} University Complaint & Application Management System</span>
        <span>All systems operational</span>
      </div>
    </footer>
  );
}
