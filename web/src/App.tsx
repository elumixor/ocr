import { useEffect, useState } from "react";

interface Song {
  id: string;
  title: string;
  ukrainian: string;
  romanian: string;
}

function SongCard({
  song,
  isSelected,
  onClick,
}: {
  song: Song;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 16px",
        border: isSelected ? "2px solid #4a90d9" : "1px solid #ddd",
        borderRadius: "8px",
        background: isSelected ? "#e8f0fe" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontWeight: 600, color: "#333" }}>{song.title}</div>
    </button>
  );
}

function SongDetails({ song }: { song: Song }) {
  const imageUrl = `${import.meta.env.BASE_URL}songs/${song.id}/source.jpeg`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#1a73e8", marginTop: 0, marginBottom: "12px" }}>
            Ukrainian
          </h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "15px",
              lineHeight: 1.6,
              background: "#f8f9fa",
              padding: "16px",
              borderRadius: "8px",
              margin: 0,
            }}
          >
            {song.ukrainian}
          </pre>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#e94235", marginTop: 0, marginBottom: "12px" }}>
            Romanian
          </h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "15px",
              lineHeight: 1.6,
              background: "#fef7f6",
              padding: "16px",
              borderRadius: "8px",
              margin: 0,
            }}
          >
            {song.romanian}
          </pre>
        </div>
      </div>
      <div>
        <h3 style={{ color: "#666", marginTop: 0, marginBottom: "12px" }}>
          Source Image
        </h3>
        <img
          src={imageUrl}
          alt={`Source for ${song.title}`}
          style={{
            maxWidth: "100%",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        />
      </div>
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}songs.json`)
      .then((res) => res.json())
      .then((data: Song[]) => {
        setSongs(data);
        setSelectedSong(data[0] || null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "system-ui",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          background: "linear-gradient(135deg, #1a73e8 0%, #4a90d9 100%)",
          color: "white",
          padding: "24px 32px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 600 }}>
          Ukrainian Christmas Carols
        </h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
          with Romanian translations
        </p>
      </header>

      <main
        style={{
          display: "flex",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "24px",
          gap: "24px",
        }}
      >
        <aside
          style={{
            width: "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              textTransform: "uppercase",
              color: "#666",
              margin: "0 0 8px",
              letterSpacing: "0.5px",
            }}
          >
            Songs ({songs.length})
          </h2>
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isSelected={selectedSong?.id === song.id}
              onClick={() => setSelectedSong(song)}
            />
          ))}
        </aside>

        <section
          style={{
            flex: 1,
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {selectedSong && (
            <>
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: "24px",
                  color: "#333",
                  borderBottom: "2px solid #eee",
                  paddingBottom: "12px",
                }}
              >
                {selectedSong.title}
              </h2>
              <SongDetails song={selectedSong} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
