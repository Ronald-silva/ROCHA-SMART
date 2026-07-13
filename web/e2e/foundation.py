import argparse
from playwright.sync_api import sync_playwright


INTERNAL_TERMS = ["DATABASE_URL", "NEXT_PUBLIC_", "ai_metadata", "execute seed", "cadastre produtos", "PrismaClient", "stack trace"]


def assert_public(page):
    text = page.locator("body").inner_text()
    for term in INTERNAL_TERMS:
        assert term.lower() not in text.lower(), f"mensagem interna exposta: {term}"


def blocked_product(page, base, product_id):
    response = page.goto(f"{base}/p/{product_id}"); assert response.status == 200
    page.wait_for_load_state("networkidle")
    assert page.get_by_text("Este produto não possui oferta válida no momento", exact=False).is_visible()
    assert page.get_by_role("button", name="Ver oferta", exact=False).count() == 0
    assert "evil.test" not in page.content()
    assert_public(page)


def run(args):
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

        response = page.goto(args.base); assert response.status == 200
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Ler ficha →", exact=True).count() > 0; assert_public(page)

        response = page.goto(f"{args.base}/p/foundation-valid"); assert response.status == 200
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Marketplace Teste", exact=False).first.is_visible()
        assert page.get_by_text("Vendedor Terceiro Teste", exact=False).is_visible()
        assert page.get_by_text("Verificado em", exact=False).is_visible()
        button = page.get_by_role("button", name="Ver oferta na loja Marketplace Teste")
        assert button.is_visible() and button.is_enabled()
        outbound = []
        page.route("https://checkout.test.example/**", lambda route: (outbound.append(route.request.url), route.fulfill(status=200, body="fixture externa interceptada")))
        button.click(); assert page.get_by_role("button", name="Abrindo oferta…").is_disabled()
        page.get_by_role("button", name="Abrindo oferta…").click(force=True)
        page.wait_for_timeout(3000); assert len(outbound) == 1
        assert "subid=" in outbound[0]

        response = page.goto(f"{args.base}/p/foundation-manufacturer"); assert response.status == 200
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("button", name="Ver no fabricante (Marketplace Teste)").is_visible()

        for product_id in ["foundation-expired", "foundation-paused", "foundation-unavailable", "foundation-blocked", "foundation-legacy"]:
            blocked_product(page, args.base, product_id)

        response = page.goto(f"{args.base}/p/not-found-foundation"); assert response.status == 404
        # O navegador registra o 404 intencional como console error genérico.
        errors.clear()
        response = page.goto(args.empty_base); assert response.status == 200
        page.wait_for_load_state("networkidle"); assert page.get_by_text("Nossa próxima seleção de produtos está sendo preparada", exact=False).is_visible(); assert_public(page)

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        response = mobile.goto(f"{args.base}/p/foundation-valid"); assert response.status == 200
        mobile.wait_for_load_state("networkidle"); assert mobile.get_by_role("button", name="Ver oferta na loja Marketplace Teste").is_visible(); assert_public(mobile)

        response = page.goto(args.broken_base); assert response.status == 200
        page.wait_for_load_state("networkidle"); assert page.get_by_text("Catálogo temporariamente indisponível", exact=False).is_visible(); assert_public(page)

        sara = page.request.post(f"{args.base}/api/sdr/chat", data={"message": "teste", "persona": "sara"})
        assert sara.status == 503 and "temporariamente indisponível" in sara.text()
        assert not errors, f"console/page errors: {errors}"
        browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:3100")
    parser.add_argument("--empty-base", default="http://127.0.0.1:3101")
    parser.add_argument("--broken-base", default="http://127.0.0.1:3102")
    run(parser.parse_args())
