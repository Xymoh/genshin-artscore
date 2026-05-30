export function Footer() {
  return (
    <footer className="border-t border-dark-border py-6 text-center">
      <p className="text-dark-muted text-sm">
        Genshin ArtScore is a fan-made tool and is not affiliated with HoYoverse.
        <br />
        Character data provided by{" "}
        <a
          href="https://enka.network"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:opacity-80"
        >
          Enka.Network
        </a>
      </p>
    </footer>
  );
}
