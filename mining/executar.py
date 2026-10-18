from pathlib import Path
import subprocess
import sys

PASTA = Path(__file__).resolve().parent
for arquivo in ["tratar.py", "cluster.py"]:
    print(f"Executando {arquivo}...", flush=True)
    subprocess.run([sys.executable, str(PASTA / arquivo)], check=True)
