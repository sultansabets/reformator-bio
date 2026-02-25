import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface SectionContentItem {
  type: string;
  text?: string;
  url?: string;
  caption?: string;
  name?: string;
}

interface MedicalSection {
  id: string;
  title: string;
  type: string;
  content: SectionContentItem[];
}

export default function MedicalSectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<MedicalSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadSection = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:3001/medical-section/${encodeURIComponent(id)}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setSection(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load section");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSection();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasContent = section?.content && section.content.length > 0;

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Назад
        </button>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Загрузка раздела…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-destructive">
              Ошибка загрузки: {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <h2 className="text-base font-semibold text-foreground">
                {section?.title || "Раздел медкарты"}
              </h2>

              {!hasContent && (
                <p className="text-sm text-muted-foreground mt-2">
                  Нет данных.
                </p>
              )}

              {hasContent && (
                <div className="mt-2 space-y-3">
                  {section!.content.map((item, index) => {
                    if (item.type === "paragraph" && item.text) {
                      return (
                        <p key={index} className="text-sm text-foreground">
                          {item.text}
                        </p>
                      );
                    }

                    if (item.type === "bulleted_list_item" && item.text) {
                      return (
                        <ul
                          key={index}
                          className="list-disc list-inside text-sm text-foreground"
                        >
                          <li>{item.text}</li>
                        </ul>
                      );
                    }

                    if (item.type === "numbered_list_item" && item.text) {
                      return (
                        <ol
                          key={index}
                          className="list-decimal list-inside text-sm text-foreground"
                        >
                          <li>{item.text}</li>
                        </ol>
                      );
                    }

                    if (item.type === "image" && item.url) {
                      return (
                        <div key={index} className="mt-2">
                          <img
                            src={item.url}
                            alt={item.caption || section?.title || "Изображение"}
                            className="max-w-full rounded-xl border border-border"
                          />
                          {item.caption && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.caption}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (item.type === "file" && item.url) {
                      return (
                        <div key={index} className="mt-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Открыть файл
                          </a>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

