# NDLA

Monorepo for [NDLA](https://ndla.no) — the Norwegian Digital Learning Arena
(_Nasjonal digital læringsarena_), a platform for open educational resources.

## Backend (`backend/`)

JVM services built with [Mill](https://mill-build.org).

See [`backend/README.md`](backend/README.md)

## Frontend (`frontend/`)

Typescript / React applications in a workspace.

See [`frontend/README.md`](frontend/README.md)

## Toolchain

Language and runtime versions are pinned in [`mise.toml`](mise.toml) so you don't have to guess.

Using [mise](https://mise.jdx.dev) is the easiest way to get the right versions;
`mise install` in a project directory sets them up.

## License

[GPL-3.0](LICENSE)
