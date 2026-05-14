"""
Processo de longa duração para filas/agentes no Railway.
Configure um serviço separado com start: `python -m agents.worker`.
"""

import logging
import time

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rocha-smart.agents")


def main() -> None:
    log.info("Rocha Smart agents worker started (placeholder loop).")
    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()
