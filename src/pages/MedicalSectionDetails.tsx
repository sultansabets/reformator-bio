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

          {/* Плейсхолдер для пустых разделов (особенно Главврач / Реабилитолог) */}
          {!hasContent && (
            <p className="text-sm text-muted-foreground mt-2">
              Раздел в процессе заполнения.
            </p>
          )}

          {hasContent && section?.id === "analyses" && (
            <div className="mt-2 space-y-3">
              <object
                data="/medical/analyses/blood-urine.pdf"
                type="application/pdf"
                width="100%"
                height="800px"
              >
                <p className="text-sm text-muted-foreground">
                  PDF не поддерживается браузером.
                </p>
              </object>
            </div>
          )}

          {hasContent && section?.id === "uzi" && (
            <div className="mt-2 space-y-4">
              <div className="space-y-4">
                <img src="/medical/uzi/uzi1.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi2.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi3.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi4.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi5.jpg" className="w-full rounded-xl" alt="" />
              </div>
              {section.content
                .filter((item) => item.type === "text")
                .map((item, index) => (
                  <p key={index} className="text-sm whitespace-pre-line">
                    {(item as { type: "text"; text: string }).text}
                  </p>
                ))}
            </div>
          )}

          {hasContent && section?.id === "sport-doctor" && (
            <div className="mt-2 space-y-3">
              <img
                src="/medical/sport/medass.jpg"
                alt="Биоимпеданс"
                className="w-full rounded-xl"
              />
              {section.content
                .filter((item) => item.type === "text")
                .map((item, index) => (
                  <p key={index} className="text-sm whitespace-pre-line">
                    {(item as { type: "text"; text: string }).text}
                  </p>
                ))}
            </div>
          )}

          {hasContent &&
            section &&
            !["analyses", "uzi", "sport-doctor"].includes(section.id) && (
              <div className="mt-2 space-y-3">
                {section.content.map((item, index) => {
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
                  if (item.type === "text") {
                    return (
                      <p key={index} className="text-sm whitespace-pre-line">
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

