# Spreadsheet Formula Interpreter

A very basic spreadsheet formula interpreter.

## Running the project

This project uses `pnpm` as its package manager, with the minimum required version being 7.13. Install/Upgrade your local copy of `pnpm` if necessary. To run the project in dev mode use:

Just clone the repo, install the dependencies and run it

```sh
pnpm install
pnpm build
pnpm start
```

The project comes with a very bare bones interactive shell. Having ran the `dev`
command, you should see a prompt that loops like this:

```sh
(SFI) $
```

### Formulas

You can enter formulas you wish to execute, note however this isn't feature
complete and only has two cells (A1 and A2) available. Any input that starts
with an "=" symbol, is interpreted as a formula. Any other input is just
seen a text (or a string internally).

```sh
(SFI) $ SUM(A2, 22, 44)
SUM(A2, 22, 44)
```

Examples pre-pended with an "=" symbol.

```sh
(SFI) $ =SUM(A2, 22, 44)
88
(SFI) $ =A1
Hello
(SFI) $ =LEN(A1)
5
```
