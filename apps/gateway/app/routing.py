from app.providers import ProviderSpec


class NoProvider(Exception):
    pass


def candidate_providers(
    routes: dict[str, list[str]], registry: dict[str, ProviderSpec], source: str, target: str, mode: str
) -> list[ProviderSpec]:
    """All configured providers able to serve this direction, in route order (first = primary)."""
    candidates = routes.get(f"{source}->{target}") or routes.get("*", [])
    needed_outputs = {source, target} if mode == "two_way" else {target}
    out: list[ProviderSpec] = []
    for name in candidates:
        spec = registry.get(name)
        if spec is None:
            continue
        if spec.output_langs is not None and not needed_outputs <= spec.output_langs:
            continue
        out.append(spec)
    return out


def choose_provider(
    routes: dict[str, list[str]], registry: dict[str, ProviderSpec], source: str, target: str, mode: str
) -> ProviderSpec:
    """Primary provider for a direction. Routes are per DIRECTION (`tr->en` != `en->tr`); in two_way
    mode the provider must be able to speak both languages, because either side may be the output."""
    specs = candidate_providers(routes, registry, source, target, mode)
    if not specs:
        raise NoProvider(f"{source}->{target}")
    return specs[0]
