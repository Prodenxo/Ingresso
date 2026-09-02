"use client";

import { Button, Card } from "@heroui/react";
import { Eye, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { EventoPoster } from "@/components/ingressos/evento-poster";
import { FormField } from "@/components/ui/form-field";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatEventDateBadge, formatLocation } from "@/lib/ingressos-utils";
import {
  contarPalavras,
  EVENTO_DESCRICAO_MAX_PALAVRAS,
  validarDescricaoVitrine,
} from "@/lib/evento-vitrine";
import type { EventoDetalhe } from "@/types/eventos";

interface EventoVitrineEditorProps {
  evento: EventoDetalhe;
  onUpdated: (evento: EventoDetalhe) => void;
}

export function EventoVitrineEditor({
  evento,
  onUpdated,
}: EventoVitrineEditorProps) {
  const [nome, setNome] = useState(evento.nome);
  const [descricao, setDescricao] = useState(evento.descricao ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setNome(evento.nome);
    setDescricao(evento.descricao ?? "");
  }, [evento.id, evento.nome, evento.descricao]);

  const hasChanges =
    nome.trim() !== evento.nome.trim() ||
    descricao.trim() !== (evento.descricao ?? "").trim();

  const previewLocation = formatLocation({
    cidade: evento.cidade,
    estado: evento.estado,
  });
  const dateBadge = formatEventDateBadge(evento.dataInicio);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nomeTrim = nome.trim();
    const descricaoTrim = descricao.trim();
    const erroDescricao = validarDescricaoVitrine(descricaoTrim);

    if (nomeTrim.length < 3) {
      setError("O título deve ter pelo menos 3 caracteres");
      return;
    }

    if (erroDescricao) {
      setError(erroDescricao);
      return;
    }

    setIsSaving(true);

    try {
      const atualizado = await apiFetch<EventoDetalhe>(
        `/eventos/${evento.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            nome: nomeTrim,
            descricao: descricaoTrim || "",
          }),
        },
      );

      onUpdated({ ...evento, ...atualizado, lotes: evento.lotes });
      setSuccess("Vitrine atualizada. Participantes já veem o novo texto.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar vitrine",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const palavrasDescricao = contarPalavras(descricao);

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-white">Vitrine de vendas</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Título e descrição que o participante vê antes de comprar o
            ingresso.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
          <Eye className="size-3.5" aria-hidden />
          Prévia ao vivo
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="form-stack" onSubmit={(e) => void handleSave(e)}>
          <FormField
            label="Título do evento (vitrine)"
            name="evento-nome-vitrine"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Workshop Presencial, Liderança 2026"
            required
            maxLength={120}
          />
          <p className="text-xs text-zinc-500">
            Use um título claro, com benefício ou formato. Evite códigos
            internos (&quot;asdasd&quot;, &quot;teste&quot;).
          </p>

          <div className="space-y-2">
            <label
              htmlFor="evento-descricao-vitrine"
              className="text-sm font-medium text-zinc-200"
            >
              Descrição de venda
            </label>
            <textarea
              id="evento-descricao-vitrine"
              name="evento-descricao-vitrine"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={10}
              placeholder="Conte o que a pessoa vai viver, quem deve ir e por que comprar agora. Ex.: Um dia imersivo com mentores, networking e certificado."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
            <p
              className={`text-xs ${
                palavrasDescricao > EVENTO_DESCRICAO_MAX_PALAVRAS
                  ? "text-red-400"
                  : "text-zinc-500"
              }`}
            >
              {palavrasDescricao}/{EVENTO_DESCRICAO_MAX_PALAVRAS} palavras · Até{" "}
              {EVENTO_DESCRICAO_MAX_PALAVRAS} palavras
            </p>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </p>
          ) : null}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              isDisabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  Salvar vitrine
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Como aparece em Ingressos
          </p>
          <div className="overflow-hidden rounded-xl border border-white/8 bg-white/3">
            <div className="flex gap-3 p-3">
              <div className="w-20 shrink-0">
                <EventoPoster
                  imagemUrl={evento.imagemUrl}
                  bannerUrl={evento.bannerUrl}
                  nome={nome.trim() || "Seu evento"}
                  size="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Sua empresa
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-white">
                  {nome.trim() || "Título do evento"}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
                  <span className="rounded border border-white/10 px-1.5 py-0.5 uppercase text-indigo-300">
                    {dateBadge.month} {dateBadge.day}
                  </span>
                  {previewLocation ? <span>{previewLocation}</span> : null}
                </div>
                {descricao.trim() ? (
                  <p className="mt-2 line-clamp-6 whitespace-pre-line text-xs leading-relaxed text-zinc-300">
                    {descricao.trim()}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-zinc-600">
                    Adicione uma descrição para aumentar a conversão.
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-white/8 px-3 py-2 text-[10px] text-zinc-600">
              Bloco de ingressos abaixo
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
