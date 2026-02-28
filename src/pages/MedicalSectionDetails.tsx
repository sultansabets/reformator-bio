import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { medicalSections, type MedicalSection } from "@/data/medicalMock";
import { formatMedicalDate } from "@/lib/dateFormat";

export default function MedicalSectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<MedicalSection | null>(null);

  useEffect(() => {
    if (!id) return;
    const found = medicalSections.find((s) => s.id === id) || null;
    setSection(found);
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-3 space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            {section?.title || "Раздел медкарты"}
          </h2>

          {!hasContent && (
            <p className="text-sm text-muted-foreground">
              Раздел в процессе заполнения.
            </p>
          )}

          {hasContent && section?.id === "analyses" && (
            <div className="space-y-3">
              <object
                data="/medical/analyses/blood-urine.pdf"
                type="application/pdf"
                width="100%"
                height="800px"
                className="rounded-xl"
              >
                <p className="text-sm text-muted-foreground">
                  PDF не поддерживается браузером.
                </p>
              </object>
            </div>
          )}

          {hasContent && section?.id === "uzi" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <img src="/medical/uzi/uzi1.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi2.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi3.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi4.jpg" className="w-full rounded-xl" alt="" />
                <img src="/medical/uzi/uzi5.jpg" className="w-full rounded-xl" alt="" />
              </div>
              {section.content
                .filter((item) => item.type === "text")
                .map((item, index) => (
                  <p key={index} className="text-sm text-muted-foreground whitespace-pre-line">
                    {(item as { type: "text"; text: string }).text}
                  </p>
                ))}
            </div>
          )}

          {hasContent && section?.id === "sport-doctor" && (
            <div className="space-y-3">
              <img
                src="/medical/sport/medass.jpg"
                alt="Биоимпеданс"
                className="w-full rounded-xl"
              />
              {section.content
                .filter((item) => item.type === "text")
                .map((item, index) => (
                  <p key={index} className="text-sm text-muted-foreground whitespace-pre-line">
                    {(item as { type: "text"; text: string }).text}
                  </p>
                ))}
            </div>
          )}

          {hasContent &&
            section &&
            !["analyses", "uzi", "sport-doctor"].includes(section.id) && (
              <div className="space-y-3">
                {section.content.map((item, index) => {
                  if (item.type === "image") {
                    return (
                      <img
                        key={index}
                        src={item.url}
                        className="w-full rounded-xl"
                        alt=""
                      />
                    );
                  }
                  if (item.type === "text") {
                    return (
                      <p key={index} className="text-sm text-muted-foreground whitespace-pre-line">
                        {item.text}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            )}

          {section?.lastUpdated && (
            <p className="mt-3 text-xs text-muted-foreground opacity-80">
              Актуально на {formatMedicalDate(section.lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

