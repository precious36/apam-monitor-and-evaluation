export default function Topbar({ activePage }) {
  return (
    <header className="topbar topbar-minimal">
      <p className="topbar-title">{activePage}</p>
    </header>
  )
}
