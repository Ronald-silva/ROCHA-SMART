import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Rocha Smart",
  description:
    "Saiba como a Rocha Smart coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
  robots: { index: true, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2
        className="text-xl font-bold text-white"
        style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8 sm:py-20">
      <nav className="mb-8 text-xs text-zinc-500">
        <Link href="/" className="transition hover:text-emerald-400">
          Início
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <span className="text-zinc-400">Política de Privacidade</span>
      </nav>

      <header className="mb-12 space-y-4 border-b border-white/10 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
          Institucional
        </p>
        <h1
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
        >
          Política de Privacidade
        </h1>
        <p className="text-sm text-zinc-500">
          Última atualização: maio de 2025 · Vigência: imediata
        </p>
        <p className="text-base leading-relaxed text-zinc-400">
          A <strong className="text-zinc-200">Rocha Smart</strong> respeita sua privacidade. Esta
          política explica quais dados coletamos, por que, como os usamos e quais são seus direitos,
          em conformidade com a{" "}
          <strong className="text-zinc-200">
            Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)
          </strong>
          .
        </p>
      </header>

      <div className="space-y-10">
        <Section title="1. Quem somos">
          <p>
            A Rocha Smart é um <strong className="text-zinc-200">magazine digital</strong> de
            tecnologia e casa inteligente. Operamos como curadoria e conteúdo editorial — não
            realizamos vendas diretas, projetos de instalação nem atendimento pós-venda. A compra é
            sempre concluída no site oficial do fabricante ou loja autorizada.
          </p>
          <p>
            Controlador dos dados: <strong className="text-zinc-200">Rocha Smart</strong> —
            contato:{" "}
            <a
              href="mailto:contato@rochasmart.com.br"
              className="text-emerald-400 hover:underline"
            >
              contato@rochasmart.com.br
            </a>
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>
            <strong className="text-zinc-200">Dados de navegação (automáticos):</strong> endereço
            IP (anonimizado), tipo de dispositivo, navegador, páginas visitadas, tempo de sessão e
            origem do acesso (ex.: mecanismo de busca, link direto, anúncio).
          </p>
          <p>
            <strong className="text-zinc-200">Parâmetros de rastreamento de anúncios:</strong> ao
            chegar via campanha paga, capturamos identificadores de clique como{" "}
            <code className="rounded bg-white/5 px-1 text-zinc-300">fbclid</code> (Meta) e{" "}
            <code className="rounded bg-white/5 px-1 text-zinc-300">gclid</code> (Google Ads) para
            medir a eficácia das campanhas. Esses dados ficam apenas na sessão do navegador (
            <code className="rounded bg-white/5 px-1 text-zinc-300">sessionStorage</code>) e não
            são enviados a terceiros além das plataformas de anúncios abaixo.
          </p>
          <p>
            <strong className="text-zinc-200">Chat com a Sara (widget opcional):</strong> as
            perguntas digitadas no widget de atendimento são enviadas ao nosso servidor para geração
            de resposta via IA (Anthropic Claude). Não armazenamos histórico de conversas.
          </p>
          <p>
            <strong className="text-zinc-200">Não coletamos</strong> nome, e-mail, CPF, dados de
            cartão ou qualquer dado pessoal identificável sem consentimento explícito.
          </p>
        </Section>

        <Section title="3. Como usamos os dados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Medir audiência e desempenho editorial (quais matérias geram mais interesse).</li>
            <li>Atribuir conversões às campanhas de mídia paga (Google Ads, Meta Ads).</li>
            <li>Melhorar a experiência de navegação e a curadoria de produtos.</li>
            <li>Geração de respostas do assistente Sara para dúvidas pré-compra.</li>
          </ul>
          <p>
            <strong className="text-zinc-200">Base legal (LGPD):</strong> legítimo interesse do
            controlador (art. 7º, IX) para análise editorial e melhoria do serviço; execução do
            serviço de atendimento por IA mediante uso voluntário do chat.
          </p>
        </Section>

        <Section title="4. Cookies e tecnologias de rastreamento">
          <p>
            Utilizamos cookies próprios (sessão e preferências) e cookies de terceiros das seguintes
            plataformas:
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-zinc-500">
                    Plataforma
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-zinc-500">
                    Finalidade
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-zinc-500">
                    Política
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-3 text-zinc-300">Google Analytics 4</td>
                  <td className="px-4 py-3 text-zinc-400">Análise de audiência</td>
                  <td className="px-4 py-3">
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      google.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-300">Google Ads</td>
                  <td className="px-4 py-3 text-zinc-400">Atribuição de conversão</td>
                  <td className="px-4 py-3">
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      google.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-zinc-300">Meta Pixel</td>
                  <td className="px-4 py-3 text-zinc-400">Atribuição de conversão e remarketing</td>
                  <td className="px-4 py-3">
                    <a
                      href="https://www.facebook.com/privacy/policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline"
                    >
                      meta.com
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Você pode bloquear cookies via configurações do navegador ou extensões como uBlock
            Origin. O site permanece funcional sem cookies de terceiros.
          </p>
        </Section>

        <Section title="5. Links de parceiro (programa de afiliados)">
          <p>
            Alguns links neste site são de <strong className="text-zinc-200">parceiro afiliado</strong>{" "}
            — incluindo links do{" "}
            <strong className="text-zinc-200">Programa de Associados da Amazon</strong>. Quando você
            clica em um desses links e realiza uma compra, a Rocha Smart pode receber uma comissão,{" "}
            <strong className="text-zinc-200">sem custo adicional para você</strong>. O preço final
            é sempre o do vendedor oficial.
          </p>
          <p>
            A Rocha Smart participa do{" "}
            <strong className="text-zinc-200">
              Programa de Associados da Amazon.com.br
            </strong>
            , um programa de publicidade afiliada desenvolvido para oferecer um meio de ganho de
            comissões pela divulgação e recomendação de produtos do site Amazon.com.br.
          </p>
        </Section>

        <Section title="6. Compartilhamento de dados">
          <p>
            Não vendemos nem alugamos dados pessoais. Compartilhamos dados somente com:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Plataformas de análise e publicidade listadas na seção 4, conforme suas próprias
              políticas.
            </li>
            <li>
              Anthropic (processamento do chat da Sara) — os dados são usados apenas para gerar a
              resposta e não são retidos para treinamento de modelos mediante nossa configuração.
            </li>
          </ul>
        </Section>

        <Section title="7. Retenção de dados">
          <p>
            Dados de navegação via Google Analytics são retidos por 14 meses (configuração padrão
            GA4). Parâmetros de clique (<code className="rounded bg-white/5 px-1 text-zinc-300">fbclid</code>,{" "}
            <code className="rounded bg-white/5 px-1 text-zinc-300">gclid</code>) ficam apenas na
            sessão do navegador e são apagados ao fechar a aba. Não mantemos banco de dados de
            usuários ou histórico de navegação em nossos servidores.
          </p>
        </Section>

        <Section title="8. Seus direitos (LGPD)">
          <p>Como titular de dados, você tem o direito de:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar os dados que temos sobre você.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Apresentar reclamação à ANPD (Autoridade Nacional de Proteção de Dados).</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato:{" "}
            <a
              href="mailto:privacidade@rochasmart.com.br"
              className="text-emerald-400 hover:underline"
            >
              privacidade@rochasmart.com.br
            </a>
          </p>
        </Section>

        <Section title="9. Segurança">
          <p>
            O site é servido integralmente via HTTPS. Não armazenamos senhas ou dados financeiros.
            Nosso banco de dados (Neon PostgreSQL) não guarda informações pessoais identificáveis de
            visitantes — apenas o catálogo editorial de produtos.
          </p>
        </Section>

        <Section title="10. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. A data de &ldquo;última atualização&rdquo; no topo
            indica quando a versão vigente entrou em vigor. Mudanças relevantes serão comunicadas
            no site.
          </p>
        </Section>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
          <p>
            Dúvidas?{" "}
            <a
              href="mailto:privacidade@rochasmart.com.br"
              className="font-medium text-emerald-400 hover:underline"
            >
              privacidade@rochasmart.com.br
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
