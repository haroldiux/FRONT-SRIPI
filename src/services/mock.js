export const db = {
  proyectos: Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    title: `Proyecto ${i + 1}`,
    code: `PRJ-${100 + i}`,
    status: i % 2 ? 'activo' : 'borrador',
    start_date: '2025-08-01',
    end_date: '2026-01-15',
  })),
  encuestadores: Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    name: `Encuestador ${i + 1}`,
    email: `e${i + 1}@sripi.tld`,
    phone: `+591 7${(1000000 + i).toString().slice(0, 6)}`,
    status: i % 3 ? 'activo' : 'inactivo',
  })),
}
