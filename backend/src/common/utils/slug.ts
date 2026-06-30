export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function buildUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalized = slugify(base) || 'evento'
  let candidate = normalized
  let suffix = 1

  while (await exists(candidate)) {
    suffix += 1
    candidate = `${normalized}-${suffix}`
  }

  return candidate
}
