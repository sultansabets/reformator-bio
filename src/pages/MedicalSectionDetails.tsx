import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { medicalSections } from "@/data/medicalMock";

type ContentItem =
  | { type: "image"; url: string }
  | { type: "pdf"; url: string }
  | { type: "text"; text: string };

interface MedicalSection {
  id: string;
  title: string;
  content: ContentItem[];
}

export default function MedicalSectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<MedicalSection | null>(null);

  useEffect(() => {
    if (!id) return;
    const found = medicalSections.find((s) => s.id === id) || null;
    setSection(found as MedicalSection | null);
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
                if (item.type === "image") {
                  return (
                    <img
                      key={index}
                      src={item.url}
                      className="w-full rounded-xl mb-4"
                      alt=""
                    />
                  );
                }

                if (item.type === "pdf") {
                  return (
                    <iframe
                      key={index}
                      src={item.url}
                      className="w-full h-[600px] rounded-xl border border-border mb-4"
                    />
                  );
                }

                if (item.type === "text") {
                  return (
                    <p key={index} className="mb-4 whitespace-pre-line">
                      {item.text}
                    </p>
                  );
                }

                return null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

