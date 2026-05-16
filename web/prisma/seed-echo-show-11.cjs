"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SKU = "AMAZON-ECHO-SHOW-11-GRA";

const data = {
  name: 'Amazon Echo Show 11 — Smart Display Full HD 11"',
  description:
    'Smart display de 11" Full HD com hub de casa inteligente integrado (Zigbee, Matter, Thread), câmera 13 MP com enquadramento automático, áudio espacial e Alexa. Certificado para o Brasil.',
  sku: SKU,
  price: "1899.00",
  stockQuantity: 0,
  imageUrl: "/echo-show-11/echo-show-11-hero.jpg",
  brand: "Amazon",
  ai_metadata: {
    smart_home: {
      voltage: "Bivolt (100–240 V, 60 Hz)",
      connectivity: ["Wi-Fi 802.11 a/b/g/n/ac (2,4 / 5 GHz)", "Bluetooth 5.0 + BLE"],
      protocols: [
        "Zigbee 3.0",
        "Matter (controller)",
        "Thread (border router)",
        "Amazon Sidewalk",
      ],
      display: '11" Full HD (1920×1200) sensível ao toque, brilho adaptável',
      audio: "Áudio espacial — tweeter + woofer dedicado; graves 2× vs Echo Show 8",
      camera: "13 MP, enquadramento automático, zoom digital 3,3×, redução de ruído por IA",
      dimensions: "305 × 214 × 88 mm",
      weight: "1,7 kg",
      processor: "Octa-core 1,7 GHz",
      hub_integrado: "Zigbee + Matter + Thread — sem hub dedicado adicional",
      garantia: "1 ano — Amazon Brasil",
    },
    affiliate: {
      checkout_url: "https://www.amazon.com.br/dp/B09B2SLKBP",
    },
    gallery: [
      "/echo-show-11/echo-show-11-hero.jpg",
      "/echo-show-11/echo-show-11-certificado.jpg",
      "/echo-show-11/echo-show-11-hub.jpg",
      "/echo-show-11/echo-show-11-memorias.jpg",
      "/echo-show-11/echo-show-11-privacidade.jpg",
      "/echo-show-11/echo-show-11-som.jpg",
    ],
    features: [
      {
        icon: "display",
        title: 'Tela Full HD 11" — 60% mais área de visualização',
        description:
          "Design integrado com bordas mínimas. Cores vibrantes e toque responsivo. 60% mais área que o Echo Show 8 — ideal para receitas, streaming e videochamadas.",
      },
      {
        icon: "audio",
        title: "Áudio Espacial Envolvente",
        description:
          "Tweeter e woofer dedicados com graves 2× mais potentes que o Echo Show 8. Palco sonoro amplo e vocais nítidos para músicas, séries e chamadas.",
      },
      {
        icon: "hub",
        title: "Hub de Casa Inteligente Integrado",
        description:
          "Controla dispositivos Zigbee, Matter e Thread sem hub adicional. Gerencie luzes, ar-condicionado, câmeras e ative rotinas por voz ou toque na tela.",
      },
      {
        icon: "camera",
        title: "Câmera 13 MP com IA",
        description:
          "Enquadramento automático mantém você no centro da tela. Zoom digital 3,3× e redução de ruído por IA para videochamadas com qualidade profissional.",
      },
      {
        icon: "privacy",
        title: "Privacidade Garantida por Hardware",
        description:
          "Botão físico desativa microfone e câmera ao nível do hardware — não por software. Indicador vermelho visível confirma quando estão desligados.",
      },
      {
        icon: "alexa",
        title: "Alexa na Tela Grande",
        description:
          "Receitas passo a passo, calendário visual, Prime Video, Netflix e rotinas por movimento — tudo a um toque ou ao comando de voz.",
      },
    ],
    editorial: {
      headline: "O smart display que virou hub — sem precisar de mais nada.",
      intro:
        "O Echo Show 11 não é apenas uma tela grande com Alexa: é o ponto de controle da casa conectada. Zigbee, Matter e Thread integrados substituem um hub dedicado — e ainda entregam vídeo Full HD, áudio espacial e videochamadas com câmera de 13 MP. Certificado para o Brasil.",
    },
    protocolos_na_lupa: {
      enabled: true,
    },
  },
};

async function main() {
  const existing = await prisma.product.findUnique({ where: { sku: SKU } });
  if (existing) {
    console.log("Produto já existe, atualizando:", existing.id);
    const updated = await prisma.product.update({ where: { sku: SKU }, data });
    console.log("Atualizado:", updated.id);
    return;
  }
  const created = await prisma.product.create({ data });
  console.log("Produto criado:", created.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
