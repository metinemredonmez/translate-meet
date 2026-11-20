from app.providers import ProviderSpec


class NoProvider(Exception):
    pass


def choose_provider(
    routes: dict[str, list[str]], registry: dict[str, ProviderSpec], source: str, target: str, mode: str
) -> ProviderSpec:
    """Routes are per DIRECTION (`tr->en` != `en->tr`). In two_way mode the provider must be able
    to speak both languages, because either side may be the output."""
    candidates = routes.get(f"{source}->{target}") or routes.get("*", [])
    needed_outputs = {source, target} if mode == "two_way" else {target}
    for name in candidates:
        spec = registry.get(name)
        if spec is None:
            continue
        if spec.output_langs is not None and not needed_outputs <= spec.output_langs:
            continue
        return spec
    raise NoProvider(f"{source}->{target}")
