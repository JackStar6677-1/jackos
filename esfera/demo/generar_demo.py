#!/usr/bin/env python3
"""Genera datos de DEMOSTRACION (grafo global + flota + agentes) para la esfera. Nada real.
Uso: python3 demo/generar_demo.py   (necesita numpy)"""
import json, os
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(42)
P, N = 60, 40000
K = 1.15 / 30000
cols = ["#ffb000", "#2fe0ff", "#ffcc33", "#ff6a2a", "#9a6bff", "#ff4fa8", "#4dffb0"]
i = np.arange(P) + .5; y = 1 - 2 * i / P; r = np.sqrt(1 - y * y); a = i * 2.399963
centros = np.stack([np.cos(a) * r, y, np.sin(a) * r], 1)
proj = rng.integers(0, P, N)
pos = centros[proj] + rng.normal(0, .13, (N, 3))
pos = pos / np.linalg.norm(pos, axis=1, keepdims=True) * rng.uniform(.72, 1.0, (N, 1))
uni = pos * np.array([1, .45, 1]) + rng.normal(0, .02, (N, 3))
edges = []
for p in range(P):
    idx = np.where(proj == p)[0]
    if len(idx) < 3: continue
    for u in idx:
        for v in rng.choice(idx, 2): 
            if u != v: edges.append((u, v))
hubs = rng.choice(N, 220, replace=False)
for h in hubs:
    mate = np.where(proj == proj[h])[0]
    for v in rng.choice(mate, min(len(mate), rng.integers(30, 160)), replace=False):
        if v != h: edges.append((h, v))
nintra = len(edges)
cross = [(rng.integers(0, N), rng.integers(0, N)) for _ in range(6000)]
edges += cross
E = np.array(edges, np.uint32)
deg = np.bincount(E.ravel(), minlength=N).clip(0, 65535).astype(np.uint16)
os.makedirs(f"{AQUI}/data", exist_ok=True); os.makedirs(f"{AQUI}/api", exist_ok=True)
np.concatenate([np.round(pos.ravel() / K), np.round(uni.ravel() / K)]).clip(-32767, 32767).astype("<i2").tofile(f"{AQUI}/data/pos.bin")
np.stack([proj, rng.integers(0, 5, N), proj % 300, deg], 1).astype("<u2").tofile(f"{AQUI}/data/nodes.bin")
E.astype("<u4").tofile(f"{AQUI}/data/edges.bin")
np.zeros(N, np.uint8).tofile(f"{AQUI}/data/kinds.bin")
json.dump({"n": N, "m": len(E), "ncruzadas": len(cross), "nintra": nintra, "colores": [cols[k % len(cols)] for k in range(P)],
           "proyectos": [f"proyecto-{k}" for k in range(P)], "tipos": ["code", "doc", "config", "concept", "otro"]}, open(f"{AQUI}/data/meta.json", "w"))
estados = ["Up 3 days (healthy)", "Up 5 hours", "Up 2 days (healthy)", "Exited (0) 1 hour ago", "Up 1 day (unhealthy)"]
json.dump([{"name": f"servicio-{k}", "status": estados[k % 5 if k % 7 else 0], "cpu": 0, "mem": "50MiB", "ports": "", "src": True} for k in range(24)],
          open(f"{AQUI}/api/docker_list.json", "w"))
nn = 90
json.dump({"name": "AGENTES", "nodes": [{"id": k, "l": f"n{k}", "k": "x"} for k in range(nn)],
           "edges": [[int(rng.integers(0, nn)), int(rng.integers(0, nn)), "x"] for _ in range(240)]}, open(f"{AQUI}/api/saori_grafo.json", "w"))
print("demo generado: nodos", N, "aristas", len(E))
